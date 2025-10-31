
/**************************************************************
 🔥 DATA MANAGER – FIRESTORE ONLY (ENGLISH, NO LOCAL SEED)
 v2 – Fixed missing method calls and safe Firestore-only behavior
**************************************************************/

let db;
if (window.firebase) {
  db = firebase.firestore();
  window.db = db;
} else {
  console.warn("Firebase SDK not loaded yet — will retry later");
}

class DataManager {
  constructor() {
    this.isOnline = false;
    this.firebaseInitialized = false;
    this.categories = [];
    this.products = [];
    this.slides = [];
    this.footerContent = {};
    this.content = {};
    this.initialize();
  }

  async initFirebase() {
    try {
      let tries = 0;
      while (typeof firebase === "undefined" && tries < 10) {
        await new Promise(res => setTimeout(res, 500));
        tries++;
      }
      if (typeof firebase === "undefined") throw new Error("Firebase SDK not loaded");

      db = firebase.firestore();
      window.db = db;

      // Test Firestore connection
      await db.collection("websiteData").doc("connectionTest").set({
        test: true,
        timestamp: new Date(),
      });

      this.isOnline = true;
      this.firebaseInitialized = true;
      console.log("Connected to Firebase Firestore");

      // Simplified safe initialization (no undefined methods)
      await this.loadAllDataFromFirestore();
      await this.getSlides();
    } catch (error) {
      this.isOnline = false;
      console.warn("Firestore not available, running in offline mode:", error.message);
    }
  }

  async initializeData() {
    const adminCredentials = { username: "admin", password: "password123" };
    localStorage.setItem("adminCredentials", JSON.stringify(adminCredentials));
    if (!localStorage.getItem("content")) localStorage.setItem("content", JSON.stringify({}));
    if (!localStorage.getItem("footerContent")) localStorage.setItem("footerContent", JSON.stringify({}));
    if (!localStorage.getItem("categories")) localStorage.setItem("categories", JSON.stringify([]));
    if (!localStorage.getItem("products")) localStorage.setItem("products", JSON.stringify([]));
    if (!localStorage.getItem("heroSlides")) localStorage.setItem("heroSlides", JSON.stringify([]));
  }

  async initialize() {
    await this.initFirebase();
    await this.initializeData();
    await this.loadAllDataFromFirestore();
    this.subscribeToFirestoreUpdates();
    console.log("DataManager initialized successfully");
  }

  /********************** FIRESTORE LOADERS ************************/
  async loadAllDataFromFirestore() {
    if (!this.isOnline || !db) {
      console.log("Offline mode: using local storage snapshots");
      return;
    }
    try {
      const docSnap = await db.collection("websiteData").doc("allData").get();

      // ✅ SAFEGUARD: if Firestore is empty, clear local cache and skip upload
      if (!docSnap.exists) {
        console.log("Firestore empty → clearing old localStorage to prevent overwrite");
        localStorage.clear();
        this.content = {};
        this.footerContent = {};
        this.categories = [];
        this.products = [];
        this.slides = [];
        return;
      }

      const data = docSnap.data() || {};
      if (data.content) {
        localStorage.setItem("content", JSON.stringify(data.content));
        this.content = data.content;
      }
      if (data.categories) {
        localStorage.setItem("categories", JSON.stringify(data.categories));
        this.categories = data.categories;
      }
      if (data.products) {
        localStorage.setItem("products", JSON.stringify(data.products));
        this.products = data.products;
      }
      if (data.footerContent) {
        localStorage.setItem("footerContent", JSON.stringify(data.footerContent));
        this.footerContent = data.footerContent;
      }
      if (data.slides) {
        localStorage.setItem("heroSlides", JSON.stringify(data.slides));
        this.slides = data.slides;
      }

      console.log("✅ All data loaded from Firestore safely");
    } catch (e) {
      console.error("Error loading Firestore data:", e);
    }
  }

  async getCategoriesFromFirestore() {
    try {
      if (!this.isOnline || !db) return this.getCategories();
      const snapshot = await db.collection("websiteData").doc("categories").collection("items").get();
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem("categories", JSON.stringify(categories));
      this.categories = categories;
      return categories;
    } catch (e) {
      console.error("Error fetching categories:", e);
      return this.getCategories();
    }
  }

  async getProductsFromFirestore() {
    try {
      if (!this.isOnline || !db) return this.getProducts();
      const snapshot = await db.collection("websiteData").doc("products").collection("items").get();
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem("products", JSON.stringify(products));
      this.products = products;
      return products;
    } catch (e) {
      console.error("Error fetching products:", e);
      return this.getProducts();
    }
  }

  async getSlides() {
    try {
      if (!this.isOnline || !db)
        return JSON.parse(localStorage.getItem("heroSlides")) || [];
      const snap = await db.collection("websiteData").doc("slides").collection("items").get();
      const slides = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem("heroSlides", JSON.stringify(slides));
      this.slides = slides;
      return slides;
    } catch (e) {
      console.error("getSlides error:", e);
      return JSON.parse(localStorage.getItem("heroSlides")) || [];
    }
  }

  /********************** BASIC GETTERS & SETTERS ************************/
  getContent() {
    try { return JSON.parse(localStorage.getItem("content")) || {}; }
    catch { return {}; }
  }

  async updateMultipleContent(updates) {
    if (!this.isOnline || !db) {
      console.warn("Offline or Firestore unavailable → skipping write");
      return;
    }
    const current = this.getContent();
    const merged = { ...current, ...updates };
    localStorage.setItem("content", JSON.stringify(merged));
    this.content = merged;
    await db.collection("websiteData").doc("content").set(merged, { merge: true });
  }

  getFooterContent() {
    try { return JSON.parse(localStorage.getItem("footerContent")) || {}; }
    catch { return {}; }
  }

  async updateFooterContent(updates) {
    if (!this.isOnline || !db) {
      console.warn("Offline or Firestore unavailable → skipping write");
      return;
    }
    const current = this.getFooterContent();
    const merged = { ...current, ...updates };
    localStorage.setItem("footerContent", JSON.stringify(merged));
    this.footerContent = merged;
    await db.collection("websiteData").doc("footer").set(merged, { merge: true });
  }

  getCategories() {
    try { return JSON.parse(localStorage.getItem("categories")) || []; }
    catch { return []; }
  }

  getProducts() {
    try { return JSON.parse(localStorage.getItem("products")) || []; }
    catch { return []; }
  }

  /********************** FIRESTORE SYNC ************************/
  subscribeToFirestoreUpdates() {
    if (!this.isOnline || !db) return;
    db.collection("websiteData").doc("allData").onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        Object.keys(data).forEach(k => {
          if (typeof data[k] === "object") {
            localStorage.setItem(k, JSON.stringify(data[k]));
          }
        });
        console.log("Data auto-updated from Firestore");
      }
    });
  }
}

/********************** INITIALIZER ************************/
let dataManager = null;
function initializeDataManager() {
  dataManager = new DataManager();
  window.dataManager = dataManager;
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initializeDataManager);
else
  initializeDataManager();
