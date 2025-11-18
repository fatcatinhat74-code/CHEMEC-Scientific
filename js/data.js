
/**************************************************************
 🔥 DATA MANAGER – FIRESTORE ONLY (ENGLISH, NO LOCAL SEED)
**************************************************************/

let db;
if (window.firebase) {
  db = firebase.firestore();
  window.db = db;
} else {
  console.warn("Firebase SDK not loaded yet — will retry later");
}

// =============================================================
// DataManager Class
// =============================================================
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

  // =============================================================
  // 🔹 Firebase Initialization
  // =============================================================
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

      // Connectivity test
      await db.collection("websiteData").doc("connectionTest").set({
        test: true,
        timestamp: new Date(),
      });

      this.isOnline = true;
      this.firebaseInitialized = true;
      console.log("Connected to Firebase Firestore");

      await this.loadAllDataFromFirestore();
      await this.loadAllCategories();
      await this.loadAllProducts();
      await this.getSlides();
    } catch (error) {
      this.isOnline = false;
      console.warn("Firestore not available, running in offline mode:", error.message);
    }
  }

  // =============================================================
  // 🔹 Local Initialization (NO DEFAULT SEED)
  // =============================================================
  async initializeData() {
    // Admin credentials only (can be changed later to Firebase Auth)
    const adminCredentials = { username: "admin", password: "password123" };
    localStorage.setItem("adminCredentials", JSON.stringify(adminCredentials));

    // Ensure empty containers exist (no branded defaults)
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
    console.log("DataManager initialized");
  }

  // =============================================================
  // 🔹 Firestore Getters
  // =============================================================
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

  // Cache loaders
  async loadAllCategories() { this.categories = await this.getCategoriesFromFirestore(); }
  async loadAllProducts() { this.products = await this.getProductsFromFirestore(); }

  async loadAllDataFromFirestore() {
    if (!this.isOnline || !db) {
      console.log("Offline mode: using local storage snapshots");
      return;
    }
    try {
      // Try the consolidated snapshot first
      const docSnap = await db.collection("websiteData").doc("allData").get();
      if (docSnap.exists) {
        const data = docSnap.data();
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
      }

      // Always refresh point documents
      const contentDoc = await db.collection("websiteData").doc("content").get();
      if (contentDoc.exists) {
        localStorage.setItem("content", JSON.stringify(contentDoc.data()));
        this.content = contentDoc.data();
      }
      const footerDoc = await db.collection("websiteData").doc("footer").get();
      if (footerDoc.exists) {
        localStorage.setItem("footerContent", JSON.stringify(footerDoc.data()));
        this.footerContent = footerDoc.data();
      }

      await this.loadAllCategories();
      await this.loadAllProducts();
      await this.getSlides();

      console.log("All data loaded from Firestore");
    } catch (e) {
      console.error("Error loading Firestore data:", e);
    }
  }

  // =============================================================
  // 🔹 Content & Footer
  // =============================================================
  getContent() {
    try { return JSON.parse(localStorage.getItem("content")) || {}; }
    catch { return {}; }
  }

  async updateMultipleContent(updates) {
    const current = this.getContent();
    const merged = { ...current, ...updates };
    localStorage.setItem("content", JSON.stringify(merged));
    this.content = merged;

    if (this.isOnline && db) {
      await db.collection("websiteData").doc("content").set(merged, { merge: true });
    }

    if (typeof updateWebsiteContent === "function") updateWebsiteContent();
    return merged;
  }

  getFooterContent() {
    try { return JSON.parse(localStorage.getItem("footerContent")) || {}; }
    catch { return {}; }
  }

  async updateFooterContent(updates) {
    const current = this.getFooterContent();
    const merged = { ...current, ...updates };
    localStorage.setItem("footerContent", JSON.stringify(merged));
    this.footerContent = merged;

    if (this.isOnline && db) {
      await db.collection("websiteData").doc("footer").set(merged, { merge: true });
    }
  }

  // =============================================================
  // 🔹 Categories CRUD
  // =============================================================
  getCategories() {
    try { return JSON.parse(localStorage.getItem("categories")) || []; }
    catch { return []; }
  }

  async addCategory(category) {
    const id = Date.now().toString();
    const cats = this.getCategories();
    const newCat = { id, ...category };
    cats.push(newCat);
    localStorage.setItem("categories", JSON.stringify(cats));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("categories").collection("items").doc(id).set(newCat);
    }
  }

  async updateCategory(id, updated) {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.id === id);
    if (idx !== -1) cats[idx] = { id, ...updated };
    localStorage.setItem("categories", JSON.stringify(cats));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("categories").collection("items").doc(String(id)).set(updated, { merge: true });
    }
  }

  async deleteCategory(id) {
    const cats = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem("categories", JSON.stringify(cats));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("categories").collection("items").doc(String(id)).delete();
    }
  }

  // =============================================================
  // 🔹 Products CRUD
  // =============================================================
  getProducts() {
    try { return JSON.parse(localStorage.getItem("products")) || []; }
    catch { return []; }
  }

  async addProduct(product) {
    const id = Date.now().toString();
    const prods = this.getProducts();
    const newProd = { id, ...product };
    prods.push(newProd);
    localStorage.setItem("products", JSON.stringify(prods));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("products").collection("items").doc(id).set(newProd);
    }
  }

  async updateProduct(id, updated) {
    const prods = this.getProducts();
    const idx = prods.findIndex(p => p.id === id);
    if (idx !== -1) prods[idx] = { id, ...updated };
    localStorage.setItem("products", JSON.stringify(prods));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("products").collection("items").doc(String(id)).set(updated, { merge: true });
    }
  }

  async deleteProduct(id) {
    const prods = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem("products", JSON.stringify(prods));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("products").collection("items").doc(String(id)).delete();
    }
  }

  // =============================================================
  // 🔹 Slides CRUD
  // =============================================================
  async getSlides() {
    try {
      if (!this.isOnline || !db) {
        return JSON.parse(localStorage.getItem("heroSlides")) || [];
      }
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

  async addSlide(slide) {
    const id = Date.now().toString();
    slide.id = id;
    const slides = await this.getSlides();
    slides.push(slide);
    localStorage.setItem("heroSlides", JSON.stringify(slides));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("slides").collection("items").doc(id).set(slide);
    }
  }

  async updateSlide(id, updatedSlide) {
    const slides = await this.getSlides();
    const idx = slides.findIndex(s => s.id == id);
    if (idx !== -1) slides[idx] = { ...slides[idx], ...updatedSlide };
    localStorage.setItem("heroSlides", JSON.stringify(slides));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("slides").collection("items").doc(String(id)).set(updatedSlide, { merge: true });
    }
  }

  async deleteSlide(id) {
    const slides = await this.getSlides();
    const filtered = slides.filter(s => s.id != id);
    localStorage.setItem("heroSlides", JSON.stringify(filtered));
    if (this.isOnline && db) {
      await db.collection("websiteData").doc("slides").collection("items").doc(String(id)).delete();
    }
  }

  // =============================================================
  // 🔹 Real-time Sync
  // =============================================================
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

// ===============================
// WEBSITE CONTENT UPDATER
// ===============================
function updateWebsiteContent() {
  if (!window.dataManager) return;
  const content = window.dataManager.getContent();

  // Navbar website name
  const websiteNameElement = document.getElementById('navbar-website-name');
  if (websiteNameElement && content['website-name']) {
    websiteNameElement.textContent = content['website-name'];
  }

  // Update page titles
  if (content['website-name']) updatePageTitles(content['website-name']);

  // Page hero mapping
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const page = window.location.pathname.split('/').pop() || 'index.html';

  const pageHeroData = {
    'about.html': { title: content['page-about-title'], desc: content['page-about-desc'] },
    'products.html': { title: content['page-products-title'], desc: content['page-products-desc'] },
    'achievements.html': { title: content['page-achievements-title'], desc: content['page-achievements-desc'] },
    'admin.html': { title: content['page-admin-title'], desc: content['page-admin-desc'] }
  };

  if (pageHeroData[page] && heroTitle && heroSubtitle) {
    if (pageHeroData[page].title) heroTitle.textContent = pageHeroData[page].title;
    if (pageHeroData[page].desc) heroSubtitle.textContent = pageHeroData[page].desc;
  }

  // Services
  updateServicesContent(content);
  // About
  updateAboutPageContent(content);
}



function updateServicesContent(content) {
  const servicesTitle = document.getElementById('services-title');
  if (servicesTitle && content['services-title']) servicesTitle.textContent = content['services-title'];
  for (let i = 1; i <= 3; i++) {
    const serviceTitle = document.getElementById(`service-${i}-title`);
    const serviceDesc = document.getElementById(`service-${i}-desc`);
    if (serviceTitle && content[`service-${i}-title`]) serviceTitle.textContent = content[`service-${i}-title`];
    if (serviceDesc && content[`service-${i}-desc`]) serviceDesc.textContent = content[`service-${i}-desc`];
  }
}

function updateAboutPageContent(content) {
  const aboutSections = document.querySelectorAll('.about-section');
  aboutSections.forEach(section => { if (section) section.style.opacity = '1'; });

  const map = [
    ['about-history-title','about-history-text'],
    ['about-mission-title','about-mission-text'],
    ['about-vision-title','about-vision-text']
  ];
  map.forEach(([t, x]) => {
    const te = document.getElementById(t);
    const xe = document.getElementById(x);
    if (te && content[t]) te.textContent = content[t];
    if (xe && content[x]) xe.textContent = content[x];
  });
}

function updatePageTitles(websiteName) {
  if (!websiteName) return;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const pageTitles = {
    'index.html': websiteName,
    'about.html': `About Us - ${websiteName}`,
    'products.html': `Products - ${websiteName}`,
    'category.html': `Categories - ${websiteName}`,
    'achievements.html': `Achievements - ${websiteName}`,
    'admin.html': `Admin Panel - ${websiteName}`,
    'search-results.html': `Search Results - ${websiteName}`
  };
  document.title = pageTitles[currentPage] || websiteName;
}

// =============================================================
// Initialize DataManager
// =============================================================
let dataManager = null;
function initializeDataManager() {
  dataManager = new DataManager();
  window.dataManager = dataManager;

  const initContentUpdate = () => {
    if (window.dataManager && window.dataManager.firebaseInitialized !== undefined) {
      updateWebsiteContent();
      document.body.classList.add('content-loaded');
      setInterval(updateWebsiteContent, 10000);
    } else {
      setTimeout(initContentUpdate, 1000);
    }
  };
  setTimeout(initContentUpdate, 1500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDataManager);
} else {
  initializeDataManager();
}

// =============================================================
// Page helpers used by pages
// =============================================================
async function loadFeaturedProducts() {
  if (!window.dataManager) return [];
  const products = await window.dataManager.getProductsFromFirestore();
  const container = document.getElementById('featured-products-container');
  if (!container) return products;
  if (products.length === 0) {
    container.innerHTML = '<p>No featured products yet.</p>';
    return products;
  }
  const featured = products.slice(0, 3);
  // Replace this line in loadFeaturedProducts:
  container.innerHTML = featured.map(product => `
    <div class="product-card" onclick="navigateToProductDetail('${product.id}')">
      <div class="product-image-container">
        <img src="${product.image || 'images/placeholder-image.png'}" alt="${product.name}" onerror="handleImageError(this)">
        <div class="image-placeholder" style="display:none;">Image Not Available</div>
      </div>
      <h3>${product.name}</h3>
      <p>${product.description || ''}</p>
      ${product.specs ? `<div class="specs">${product.specs.replace(/\\n/g, '<br>')}</div>` : ''}
      <div class="price">${product.price || 'Contact for price'}</div>
    </div>
  `).join('');
  return products;
}

async function loadProductCategories() {
  if (!window.dataManager) return [];
  const categories = await window.dataManager.getCategoriesFromFirestore();
  const container = document.getElementById('products-container');
  if (!container) return categories;
  if (categories.length === 0) {
    container.innerHTML = '<p>No categories yet.</p>';
    return categories;
  }
  container.innerHTML = categories.map(category => `
    <div class="category-card" onclick="window.location.href='category.html?categoryId=${category.id}'">
      <div class="category-image-container">
        <img src="${category.image || 'images/placeholder-image.png'}" alt="${category.name}" onerror="handleImageError(this)">
        <div class="image-placeholder" style="display:none;">Image Not Available</div>
      </div>
      <div class="category-info">
        <h3>${category.name}</h3>
        <p>${category.description || ''}</p>
      </div>
    </div>
  `).join('');
  return categories;
}

async function loadCategoryProducts() {
  if (!window.dataManager) return [];
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('categoryId');
  if (!categoryId) {
    window.location.href = 'products.html';
    return [];
  }
  const products = await window.dataManager.getProductsFromFirestore();
  const categoryProducts = products.filter(p => p.categoryId === categoryId);
  const categories = await window.dataManager.getCategoriesFromFirestore();
  const currentCategory = categories.find(c => c.id === categoryId);
  const titleElement = document.getElementById('category-title');
  const descElement = document.getElementById('category-description');
  if (currentCategory) {
    if (titleElement) titleElement.textContent = currentCategory.name;
    if (descElement) descElement.textContent = currentCategory.description || '';
  }
  const container = document.getElementById('products-container');
  if (container) {
    if (categoryProducts.length > 0) {
// Replace this line in loadCategoryProducts:
container.innerHTML = categoryProducts.map(product => `
  <div class="product-card" onclick="navigateToProductDetail('${product.id}')">
    <div class="product-image-container">
      <img src="${product.image || 'images/placeholder-image.png'}" alt="${product.name}" onerror="handleImageError(this)">
      <div class="image-placeholder" style="display:none;">Image Not Available</div>
    </div>
    <h3>${product.name}</h3>
    <p>${product.description || ''}</p>
    ${product.specs ? `<div class="specs">${product.specs.replace(/\\n/g, '<br>')}</div>` : ''}
    <div class="price">${product.price || 'Contact for price'}</div>
  </div>
`).join('');
    } else {
      container.innerHTML = `
        <div class="no-products">
          <p>No products in this category yet.</p>
          <a href="products.html" class="cta-button">Back to categories</a>
        </div>
      `;
    }
  }
  return categoryProducts;


}


// =============================================================
// Product Navigation Function
// =============================================================
function navigateToProductDetail(productId) {
  window.location.href = `product.html?productId=${productId}`;
}

// Make it globally available
window.navigateToProductDetail = navigateToProductDetail;


// Image error helpers
function handleImageError(img) {
  const container = img.parentElement;
  if (container) {
    img.style.display = 'none';
    const placeholder = container.querySelector('.image-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.height = '200px';
      placeholder.style.background = '#f5f5f5';
      placeholder.style.color = '#666';
      placeholder.style.fontFamily = 'Poppins, sans-serif';
      placeholder.style.fontSize = '16px';
      placeholder.style.border = '1px dashed #ddd';
    }
  }
  
  // Also try to load a fallback online placeholder if local one fails
  if (img.src.includes('placeholder-image.png')) {
    img.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
    img.style.display = 'block';
  }
}
