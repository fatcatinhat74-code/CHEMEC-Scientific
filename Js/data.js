/**************************************************************
 🔥 DATA MANAGER – FIRESTORE COMPATIBLE (FINAL)
**************************************************************/

let db;
if (window.firebase) {
  db = firebase.firestore();
  window.db = db;
} else {
  console.warn("⚠️ Firebase SDK not loaded yet — will retry later");
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

async initialize() {
    await this.initFirebase();
    await this.initializeData();
    
    // Load data from Firestore with proper structure
    await this.loadAllDataFromFirestore();
    
    console.log("✅ DataManager fully initialized with Firestore structure");
    
    // Subscribe to real-time updates
    this.subscribeToFirestoreUpdates();
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

      await db.collection("websiteData").doc("connectionTest").set({
        test: true,
        timestamp: new Date(),
      });

      this.isOnline = true;
      this.firebaseInitialized = true;
      console.log("✅ Connected to Firebase Firestore");

      await this.loadAllCategories();
      await this.loadAllProducts();
      await this.getSlides();
      await this.loadAllDataFromFirestore();
    } catch (error) {
      this.isOnline = false;
      console.warn("⚠️ Firestore not available, using localStorage:", error.message);
    }
  }

  // =============================================================
  // 🔹 Local Initialization
  // =============================================================
  async initializeData() {
    const adminCredentials = { username: "admin", password: "password123" };
    localStorage.setItem("adminCredentials", JSON.stringify(adminCredentials));

    await this.ensureDefaultData();
  }

async ensureDefaultData() {
    const hasData = localStorage.getItem("content");
    console.log('📊 Checking if content exists:', hasData);
    
    if (!hasData) {
        console.log('ℹ️ Setting up default data...');
        await this.setupDefaultData();
    } else {
        console.log('✅ Content already exists in localStorage');
        const content = JSON.parse(hasData);
        console.log('📦 Current content:', content);
    }
}

  async setupDefaultData() {
    const defaultCategories = [
      {
        id: "1",
        name: "الأنابيب غير الملحومة",
        description: "أنابيب الصلب غير الملحومة عالية الجودة للتطبيقات عالية الضغط",
        image:
          "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=400&h=300&fit=crop",
      },
      {
        id: "2",
        name: "الأنابيب الملحومة",
        description: "أنابيب الصلب الملحومة المتينة للتطبيقات الصناعية المختلفة",
        image:
          "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=300&fit=crop",
      },
    ];
    localStorage.setItem("categories", JSON.stringify(defaultCategories));

    const defaultProducts = [
      {
        id: "1",
        categoryId: "1",
        name: "أنبوب API 5L غير الملحوم",
        description: "أنبوب غير ملحوم عالي القوة لنقل النفط والغاز",
        specs: "الحجم: 2-24 بوصة\nالمادة: الصلب الكربوني\nالمعايير: API 5L, ASTM A106",
        price: "٦٥٠ - ٢٥٠٠ جنيه",
        image:
          "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=300&fit=crop",
      },
    ];
    localStorage.setItem("products", JSON.stringify(defaultProducts));


  const defaultContent = {
        // Website name
        "website-name": "توب ستيل",
        
        // Hero section
        "hero-title": "حلول أنابيب الصلب المتميزة",
        "hero-subtitle": "نصنع أنابيب الصلب عالية الجودة للتطبيقات الصناعية والتجارية في جميع أنحاء العالم",
        
        // Intro section
        "intro-title": "مرحبًا بكم في توب ستيل",
        "intro-text": "مع أكثر من 25 عامًا من الخبرة في تصنيع أنابيب الصلب، نقدم حلول أنابيب قوية وموثوقة لتطبيقات النفط والغاز وأنظمة المياه والتطبيقات الصناعية. التزامنا بالجودة والابتكار يجعلنا الخيار المفضل عالميًا.",
        
        // Services section
        "services-title": "خدماتنا الرئيسية",
        "service-1-title": "توريد",
        "service-1-desc": "نوفر جميع أنواع المواسير الحديدية والوصلات بأعلى جودة وفي المواعيد المحددة.",
        "service-2-title": "تصنيع",
        "service-2-desc": "نقوم بتصنيع المواسير والمستلزمات المعدنية وفقاً للمواصفات المطلوبة لكل مشروع.",
        "service-3-title": "استبدال",
        "service-3-desc": "نقدم خدمة استبدال المواسير القديمة بأنظمة جديدة أكثر كفاءة وأطول عمرًا.",
        
        // ✅ ADD THIS: About page content
        "about-history-title": "تاريخنا",
        "about-history-text": "تأسست توب ستيل في عام 1998 كمزود رائد لأنابيب الصلب عالية الجودة في السوق المصري والعالمي. على مدى 25 عامًا، نمت شركتنا لتصبح واحدة من أبرز الشركات في مجال تصنيع وتوريد أنابيب الصلب.",
        
        "about-mission-title": "مهمتنا",
        "about-mission-text": "مهمتنا هي توفير حلول أنابيب الصلب المتميزة التي تلبي أعلى معايير الجودة والسلامة. نلتزم بتقديم منتجات مبتكرة وخدمة عملاء استثنائية تساهم في نجاح عملائنا ونمو صناعاتهم.",
        
        "about-vision-title": "رؤيتنا",
        "about-vision-text": "أن نكون الشركة الرائدة في مجال أنابيب الصلب في المنطقة، معترفًا بنا لتميزنا في الجودة والابتكار والاستدامة. نطمح إلى توسيع نطاق وصولنا العالمي مع الحفاظ على التزامنا بالتميز.",
          "page-about-title": "من نحن",

        "page-about-desc": "تعرف على تاريخنا، مهمتنا، والتزامنا بالتميز",
        "page-products-title": "منتجاتنا", 
        "page-products-desc": "استكشف مجموعة حلول أنابيب الصلب الشاملة لدينا",
        "page-achievements-title": "إنجازاتنا",
        "page-achievements-desc": "الاحتفاء بمعالمنا والتقدير في صناعة أنابيب الصلب",
        "page-admin-title": "Admin Panel",
        "page-admin-desc": "إدارة محتوى موقع توب ستيل"
    };
    localStorage.setItem("content", JSON.stringify(defaultContent));

    const defaultFooter = {
      companyName: "توب ستيل",
      companyDescription: "الشركة الرائدة في تصنيع أنابيب الصلب المتميزة منذ عام 1998.",
      email: "info@top-steel.com",
      phone: "+20 123 456 7890",
      address: "المنطقة الصناعية، مدينة العبور، القاهرة",
      facebook: "https://facebook.com/topsteel",
      whatsapp: "+201234567890", // ADD THIS LINE
      copyright: "Designed By Abdelrhman A. Eliwa",
    };
    localStorage.setItem("footerContent", JSON.stringify(defaultFooter));

    const defaultSlides = [
      {
        id: "1",
        image:
          "https://images.unsplash.com/photo-1581094794322-7c6dceeecb91?auto=format&fit=crop&w=1000&q=80",
        title: "حلول أنابيب الصلب المتميزة",
        subtitle:
          "نصنع أنابيب الصلب عالية الجودة للتطبيقات الصناعية والتجارية في جميع أنحاء العالم",
        active: true,
      },
    ];
    localStorage.setItem("heroSlides", JSON.stringify(defaultSlides));

    if (this.isOnline) await this.saveAllDataToFirestore();
  }

  // =============================================================
  // 🔹 Firestore Getters
  // =============================================================
  async getProductsFromFirestore() {
    try {
      const snapshot = await db
        .collection("websiteData")
        .doc("products")
        .collection("items")
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("❌ Error fetching products:", e);
      return [];
    }
  }

  async getCategoriesFromFirestore() {
    try {
      const snapshot = await db
        .collection("websiteData")
        .doc("categories")
        .collection("items")
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("❌ Error fetching categories:", e);
      return [];
    }
  }

// =============================================================
// 🔹 Cache Loaders - Updated for Firestore Structure
// =============================================================
async loadAllCategories() {
    this.categories = await this.getCategoriesFromFirestore();
    console.log(`📊 Categories cache updated: ${this.categories.length} items`);
}

async loadAllProducts() {
    this.products = await this.getProductsFromFirestore();
    console.log(`📊 Products cache updated: ${this.products.length} items`);
}

async loadAllDataFromFirestore() {
    if (!this.isOnline || !db) {
        console.log("📦 Offline mode: Loading data from localStorage");
        return;
    }
    
    try {
        console.log("🔥 Loading all data from Firestore...");
        
        // Load categories from Firestore
        await this.loadAllCategories();
        
        // Load products from Firestore  
        await this.loadAllProducts();
        
        // Load slides from Firestore
        await this.getSlides();
        
        // Load content from Firestore
        try {
            const contentDoc = await db.collection("websiteData").doc("content").get();
            if (contentDoc.exists) {
                const contentData = contentDoc.data();
                localStorage.setItem("content", JSON.stringify(contentData));
                this.content = contentData;
                console.log("✅ Content loaded from Firestore: websiteData/content");
            }
        } catch (error) {
            console.error("❌ Error loading content from Firestore:", error);
        }
        
        // Load footer from Firestore
        try {
            const footerDoc = await db.collection("websiteData").doc("footer").get();
            if (footerDoc.exists) {
                const footerData = footerDoc.data();
                localStorage.setItem("footerContent", JSON.stringify(footerData));
                this.footerContent = footerData;
                console.log("✅ Footer loaded from Firestore: websiteData/footer");
            }
        } catch (error) {
            console.error("❌ Error loading footer from Firestore:", error);
        }
        
        console.log("✅ All data loaded from Firestore with proper structure");
    } catch (e) {
        console.error("❌ Error loading Firestore data:", e);
    }
}
  // =============================================================
  // 🔹 Firestore Save & Load
  // =============================================================
  async saveAllDataToFirestore() {
    if (!this.isOnline || !db) return;
    try {
      const data = {
        categories: this.getCategories(),
        products: this.getProducts(),
        content: this.getContent(),
        footerContent: this.getFooterContent(),
        slides: await this.getSlides(),
        lastUpdated: new Date(),
      };
      await db.collection("websiteData").doc("allData").set(data, { merge: true });
      console.log("✅ All data saved to Firestore");
    } catch (e) {
      console.error("❌ Error saving all data:", e);
    }
  }

async loadAllDataFromFirestore() {
    if (!this.isOnline || !db) return;
    try {
        const docSnap = await db.collection("websiteData").doc("allData").get();
        if (docSnap.exists) {
            const data = docSnap.data();
            console.log('🔥 Firestore data loaded:', data);
            
            // Update all local storage with Firestore data
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
            
            console.log("✅ All data loaded from Firestore");
        } else {
            console.log("ℹ️ No data found in Firestore, using defaults");
        }
    } catch (e) {
        console.error("❌ Error loading Firestore data:", e);
    }
}

// =============================================================
// 🔹 Content & Footer - Firestore Structure
// =============================================================
getContent() {
    try {
        return JSON.parse(localStorage.getItem("content")) || {};
    } catch {
        return {};
    }
}

async updateMultipleContent(updates) {
    console.log('🔄 Starting content update with:', updates);
    
    const current = this.getContent();
    const merged = { ...current, ...updates };
    
    console.log('📦 Merged content:', merged);
    
    // Save to localStorage
    localStorage.setItem("content", JSON.stringify(merged));
    this.content = merged;
    
    console.log('✅ Content saved to localStorage');
    
    // Save to Firestore if online
    if (this.isOnline && db) {
        try {
            await db.collection("websiteData").doc("content").set(merged, { merge: true });
            console.log('✅ Content saved to Firestore: websiteData/content');
        } catch (error) {
            console.error('❌ Error saving content to Firestore:', error);
        }
    }
    
    // Trigger immediate website update
    if (typeof updateWebsiteContent === 'function') {
        updateWebsiteContent();
    }
    
    return merged;
}

getFooterContent() {
    try {
        return JSON.parse(localStorage.getItem("footerContent")) || {};
    } catch {
        return {};
    }
}

async updateFooterContent(updates) {
    const current = this.getFooterContent();
    const merged = { ...current, ...updates };
    localStorage.setItem("footerContent", JSON.stringify(merged));
    
    if (this.isOnline && db) {
        await db.collection("websiteData").doc("footer").set(merged, { merge: true });
        console.log('✅ Footer content saved to Firestore: websiteData/footer');
    }
    console.log('✅ Footer updated');
}
// =============================================================
// 🔹 Categories CRUD - Firestore Structure
// =============================================================
getCategories() {
    try {
        return JSON.parse(localStorage.getItem("categories")) || [];
    } catch {
        return [];
    }
}

async addCategory(category) {
    const id = Date.now().toString();
    const cats = this.getCategories();
    const newCat = { id, ...category };
    cats.push(newCat);
    localStorage.setItem("categories", JSON.stringify(cats));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("categories")
            .collection("items")
            .doc(id)
            .set(newCat);
    }
    console.log("✅ Category added to Firestore: websiteData/categories/items/" + id);
}

async updateCategory(id, updated) {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.id === id);
    if (idx !== -1) cats[idx] = { id, ...updated };
    localStorage.setItem("categories", JSON.stringify(cats));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("categories")
            .collection("items")
            .doc(String(id))
            .set(updated, { merge: true });
    }
    console.log("✅ Category updated in Firestore: websiteData/categories/items/" + id);
}

async deleteCategory(id) {
    const cats = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem("categories", JSON.stringify(cats));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("categories")
            .collection("items")
            .doc(String(id))
            .delete();
    }
    console.log("✅ Category deleted from Firestore: websiteData/categories/items/" + id);
}

async getCategoriesFromFirestore() {
    try {
        if (!this.isOnline || !db) {
            console.log("📦 Loading categories from localStorage");
            return this.getCategories();
        }

        const snapshot = await db
            .collection("websiteData")
            .doc("categories")
            .collection("items")
            .get();
            
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Update localStorage with Firestore data
        localStorage.setItem("categories", JSON.stringify(categories));
        this.categories = categories;
        
        console.log(`✅ Loaded ${categories.length} categories from Firestore: websiteData/categories/items`);
        return categories;
    } catch (e) {
        console.error("❌ Error fetching categories from Firestore:", e);
        console.log("📦 Falling back to localStorage categories");
        return this.getCategories();
    }
}

// =============================================================
// 🔹 Products CRUD - Firestore Structure
// =============================================================
getProducts() {
    try {
        return JSON.parse(localStorage.getItem("products")) || [];
    } catch {
        return [];
    }
}

async addProduct(product) {
    const id = Date.now().toString();
    const prods = this.getProducts();
    const newProd = { id, ...product };
    prods.push(newProd);
    localStorage.setItem("products", JSON.stringify(prods));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("products")
            .collection("items")
            .doc(id)
            .set(newProd);
    }
    console.log("✅ Product added to Firestore: websiteData/products/items/" + id);
}

async updateProduct(id, updated) {
    const prods = this.getProducts();
    const idx = prods.findIndex(p => p.id === id);
    if (idx !== -1) prods[idx] = { id, ...updated };
    localStorage.setItem("products", JSON.stringify(prods));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("products")
            .collection("items")
            .doc(String(id))
            .set(updated, { merge: true });
    }
    console.log("✅ Product updated in Firestore: websiteData/products/items/" + id);
}

async deleteProduct(id) {
    const prods = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem("products", JSON.stringify(prods));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("products")
            .collection("items")
            .doc(String(id))
            .delete();
    }
    console.log("✅ Product deleted from Firestore: websiteData/products/items/" + id);
}

async getProductsFromFirestore() {
    try {
        if (!this.isOnline || !db) {
            console.log("📦 Loading products from localStorage");
            return this.getProducts();
        }

        const snapshot = await db
            .collection("websiteData")
            .doc("products")
            .collection("items")
            .get();
            
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Update localStorage with Firestore data
        localStorage.setItem("products", JSON.stringify(products));
        this.products = products;
        
        console.log(`✅ Loaded ${products.length} products from Firestore: websiteData/products/items`);
        return products;
    } catch (e) {
        console.error("❌ Error fetching products from Firestore:", e);
        console.log("📦 Falling back to localStorage products");
        return this.getProducts();
    }
}

// =============================================================
// 🔹 Slides CRUD - Firestore Structure
// =============================================================
async getSlides() {
    try {
        if (!this.isOnline || !db) {
            console.log("📦 Loading slides from localStorage");
            return JSON.parse(localStorage.getItem("heroSlides")) || [];
        }

        const snap = await db
            .collection("websiteData")
            .doc("slides")
            .collection("items")
            .get();
            
        const slides = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem("heroSlides", JSON.stringify(slides));
        
        console.log(`✅ Loaded ${slides.length} slides from Firestore: websiteData/slides/items`);
        return slides;
    } catch (e) {
        console.error("❌ getSlides Firestore error:", e);
        console.log("📦 Falling back to localStorage slides");
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
        await db
            .collection("websiteData")
            .doc("slides")
            .collection("items")
            .doc(id)
            .set(slide);
    }
    console.log("✅ Slide added to Firestore: websiteData/slides/items/" + id);
}

async updateSlide(id, updatedSlide) {
    const slides = await this.getSlides();
    const idx = slides.findIndex(s => s.id == id);
    if (idx !== -1) slides[idx] = { ...slides[idx], ...updatedSlide };
    localStorage.setItem("heroSlides", JSON.stringify(slides));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("slides")
            .collection("items")
            .doc(String(id))
            .set(updatedSlide, { merge: true });
    }
    console.log("✅ Slide updated in Firestore: websiteData/slides/items/" + id);
}

async deleteSlide(id) {
    const slides = await this.getSlides();
    const filtered = slides.filter(s => s.id != id);
    localStorage.setItem("heroSlides", JSON.stringify(filtered));

    if (this.isOnline && db) {
        await db
            .collection("websiteData")
            .doc("slides")
            .collection("items")
            .doc(String(id))
            .delete();
    }
    console.log("✅ Slide deleted from Firestore: websiteData/slides/items/" + id);
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
        console.log("🔄 Data auto-updated from Firestore");
      }
    });
  }
}
// ===============================
// WEBSITE CONTENT UPDATER - DEBUG VERSION
// ===============================
function updateWebsiteContent() {
    console.log('🔄 updateWebsiteContent called');
    
    if (!window.dataManager) {
        console.warn('❌ DataManager not available');
        return;
    }
    
    const content = window.dataManager.getContent();
    console.log('📦 Content loaded for update:', content);
    
    // Update website name in navbar (inside the link)
    const websiteNameElement = document.getElementById('navbar-website-name');
    if (websiteNameElement && content['website-name']) {
        websiteNameElement.textContent = content['website-name'];
        console.log('✅ Updated website name:', content['website-name']);
    }
    
    // Update hero section on about page
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    
    const page = window.location.pathname.split('/').pop() || 'index.html';
    console.log('🎯 Current page:', page);
    
    // Page-specific hero content
    const pageHeroData = {
        'about.html': {
            title: content['page-about-title'],
            desc: content['page-about-desc']
        },
        'products.html': {
            title: content['page-products-title'],
            desc: content['page-products-desc']
        },
        'achievements.html': {
            title: content['page-achievements-title'],
            desc: content['page-achievements-desc']
        },
        'admin.html': {
            title: content['page-admin-title'],
            desc: content['page-admin-desc']
        }
    };

    if (pageHeroData[page] && heroTitle && heroSubtitle) {
        if (pageHeroData[page].title) {
            heroTitle.textContent = pageHeroData[page].title;
            console.log('✅ Updated page hero title:', pageHeroData[page].title);
        }
        if (pageHeroData[page].desc) {
            heroSubtitle.textContent = pageHeroData[page].desc;
            console.log('✅ Updated page hero subtitle:', pageHeroData[page].desc);
        }
    }
    
    // Update services content on homepage
    updateServicesContent(content);
    
    // Update about page content sections
    updateAboutPageContent(content);
}


// Add this new function to data.js
function updateServicesContent(content) {
    console.log('🔧 Updating services content');
    
    // Update services title
    const servicesTitle = document.getElementById('services-title');
    if (servicesTitle && content['services-title']) {
        servicesTitle.textContent = content['services-title'];
        console.log('✅ Updated services title:', content['services-title']);
    }
    
    // Update individual services
    for (let i = 1; i <= 3; i++) {
        const serviceTitle = document.getElementById(`service-${i}-title`);
        const serviceDesc = document.getElementById(`service-${i}-desc`);
        
        if (serviceTitle && content[`service-${i}-title`]) {
            serviceTitle.textContent = content[`service-${i}-title`];
            console.log(`✅ Updated service ${i} title:`, content[`service-${i}-title`]);
        }
        
        if (serviceDesc && content[`service-${i}-desc`]) {
            serviceDesc.textContent = content[`service-${i}-desc`];
            console.log(`✅ Updated service ${i} description:`, content[`service-${i}-desc`]);
        }
    }
}

// Update about page content
function updateAboutPageContent(content) {
    console.log('📄 Updating about page content');
    
    // Hide about content initially
    const aboutSections = document.querySelectorAll('.about-section');
    aboutSections.forEach(section => {
        if (section) section.style.opacity = '0';
    });
    
    // About page hero content
    const aboutHistoryTitle = document.getElementById('about-history-title');
    const aboutHistoryText = document.getElementById('about-history-text');
    
    if (aboutHistoryTitle && content['about-history-title']) {
        aboutHistoryTitle.textContent = content['about-history-title'];
        console.log('✅ Updated about history title');
        aboutHistoryTitle.style.opacity = '1';
    }
    if (aboutHistoryText && content['about-history-text']) {
        aboutHistoryText.textContent = content['about-history-text'];
        console.log('✅ Updated about history text');
        aboutHistoryText.style.opacity = '1';
    }
    
    const aboutMissionTitle = document.getElementById('about-mission-title');
    const aboutMissionText = document.getElementById('about-mission-text');
    if (aboutMissionTitle && content['about-mission-title']) {
        aboutMissionTitle.textContent = content['about-mission-title'];
        console.log('✅ Updated about mission title');
        aboutMissionTitle.style.opacity = '1';
    }
    if (aboutMissionText && content['about-mission-text']) {
        aboutMissionText.textContent = content['about-mission-text'];
        console.log('✅ Updated about mission text');
        aboutMissionText.style.opacity = '1';
    }
    
    const aboutVisionTitle = document.getElementById('about-vision-title');
    const aboutVisionText = document.getElementById('about-vision-text');
    if (aboutVisionTitle && content['about-vision-title']) {
        aboutVisionTitle.textContent = content['about-vision-title'];
        console.log('✅ Updated about vision title');
        aboutVisionTitle.style.opacity = '1';
    }
    if (aboutVisionText && content['about-vision-text']) {
        aboutVisionText.textContent = content['about-vision-text'];
        console.log('✅ Updated about vision text');
        aboutVisionText.style.opacity = '1';
    }
    
    // Show all about sections after updates
    setTimeout(() => {
        aboutSections.forEach(section => {
            if (section) section.style.opacity = '1';
        });
    }, 100);
}

// Update page hero content
function updatePageHeroContent() {
    if (!window.dataManager) return;
    
    const content = window.dataManager.getContent();
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const title = document.getElementById('hero-title');
    const sub = document.getElementById('hero-subtitle');
    
    console.log('🎯 Updating page hero for:', page, 'Elements - Title:', title, 'Subtitle:', sub);
    
    if (!title) return;

    const pageData = {
        'about.html': {
            title: content['page-about-title'],
            desc: content['page-about-desc']
        },
        'products.html': {
            title: content['page-products-title'],
            desc: content['page-products-desc']
        },
        'achievements.html': {
            title: content['page-achievements-title'],
            desc: content['page-achievements-desc']
        },
        'admin.html': {
            title: content['page-admin-title'],
            desc: content['page-admin-desc']
        }
    };

    if (pageData[page] && pageData[page].title && pageData[page].desc) {
        title.textContent = pageData[page].title;
        sub.textContent = pageData[page].desc;
        console.log('✅ Updated page hero content for:', page);
    }
}

// =============================================================
// 🔧 PAGE TITLE MANAGEMENT
// =============================================================

function updatePageTitles(websiteName) {
    if (!websiteName) return;
    
    console.log('🔄 Updating page titles with:', websiteName);
    
    // Get current page to determine the specific title
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Page-specific title patterns
    const pageTitles = {
        'index.html': websiteName,
        'about.html': `About Us - ${websiteName}`,
        'products.html': `Products - ${websiteName}`,
        'category.html': `Categories - ${websiteName}`,
        'achievements.html': `إنجازاتنا - ${websiteName}`,
        'admin.html': `Admin Panel  - ${websiteName}`,
        'search-results.html': `Search Results  - ${websiteName}`,
        'data-manager.html': `Data Management Tool   - ${websiteName}`
    };
    
    // Set the page title
    const pageTitle = pageTitles[currentPage] || websiteName;
    document.title = pageTitle;
    
    console.log('✅ Updated page title to:', pageTitle);
}

// Update the updateWebsiteContent function to include title updates
function updateWebsiteContent() {
    console.log('🔄 updateWebsiteContent called');
    
    if (!window.dataManager) {
        console.warn('❌ DataManager not available');
        return;
    }
    
    const content = window.dataManager.getContent();
    console.log('📦 Content loaded for update:', content);
    
    // Update website name in navbar
    const websiteNameElement = document.getElementById('navbar-website-name');
    if (websiteNameElement && content['website-name']) {
        websiteNameElement.textContent = content['website-name'];
        console.log('✅ Updated website name:', content['website-name']);
    }
    
    // UPDATE: Update page titles with website name
    if (content['website-name']) {
        updatePageTitles(content['website-name']);
    }
    
    // Rest of the function remains the same...
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    
    const page = window.location.pathname.split('/').pop() || 'index.html';
    console.log('🎯 Current page:', page);
    
    // Page-specific hero content
    const pageHeroData = {
        'about.html': {
            title: content['page-about-title'],
            desc: content['page-about-desc']
        },
        'products.html': {
            title: content['page-products-title'],
            desc: content['page-products-desc']
        },
        'achievements.html': {
            title: content['page-achievements-title'],
            desc: content['page-achievements-desc']
        },
        'admin.html': {
            title: content['page-admin-title'],
            desc: content['page-admin-desc']
        }
    };

    if (pageHeroData[page] && heroTitle && heroSubtitle) {
        if (pageHeroData[page].title) {
            heroTitle.textContent = pageHeroData[page].title;
            console.log('✅ Updated page hero title:', pageHeroData[page].title);
        }
        if (pageHeroData[page].desc) {
            heroSubtitle.textContent = pageHeroData[page].desc;
            console.log('✅ Updated page hero subtitle:', pageHeroData[page].desc);
        }
    }
    
    // Update services content on homepage
    updateServicesContent(content);
    
    // Update about page content sections
    updateAboutPageContent(content);
}

// =============================================================
// Initialize
// =============================================================
let dataManager = null;

function initializeDataManager() {
    console.log('🚀 Initializing DataManager...');
    
    // Show loading state
    document.body.classList.add('loading-content');
    
    dataManager = new DataManager();
    window.dataManager = dataManager;
    
    // Set up content update after DataManager is ready
    const initContentUpdate = () => {
        console.log('🔄 Checking DataManager status...');
        
        if (window.dataManager && window.dataManager.firebaseInitialized !== undefined) {
            console.log('✅ DataManager ready, updating content...');
            updateWebsiteContent();
            
            // Hide loading state with a small delay to ensure content is rendered
            setTimeout(() => {
                document.body.classList.remove('loading-content');
                document.body.classList.add('content-loaded');
                console.log('✅ Loading spinner hidden, content fully loaded');
            }, 500);
            
            // Update when data changes (for admin preview) - but reduce frequency
            setInterval(updateWebsiteContent, 10000); // Reduced from 3000 to 10000ms
        } else {
            console.log('⏳ DataManager not ready yet, retrying...');
            setTimeout(initContentUpdate, 1000);
        }
    };
    
    // Start the content update process after a short delay
    setTimeout(initContentUpdate, 2000);
    
    return dataManager;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        console.log('📄 DOM loaded, initializing DataManager...');
        initializeDataManager();
    });
} else {
    console.log('📄 DOM already loaded, initializing DataManager...');
    initializeDataManager();
}
// =============================================================
// 🔹 Fixed Data Loaders - No Redirects
// =============================================================

async function loadFeaturedProducts() {
    try {
        console.log('🔥 Loading featured products from Firestore...');
        
        if (!window.dataManager) {
            console.error('❌ DataManager not available');
            return [];
        }

        // Always get from Firestore first
        const products = await window.dataManager.getProductsFromFirestore();
        console.log(`✅ Loaded ${products.length} products from Firestore`);
        
        // Display the products
        const container = document.getElementById('featured-products-container');
        if (container && products.length > 0) {
            // Take first 3 products as featured
            const featuredProducts = products.slice(0, 3);
            
            container.innerHTML = featuredProducts.map(product => `
                <div class="product-card" onclick="window.location.href='category.html?categoryId=${product.categoryId}'">
                    <div class="product-image-container">
                        <img src="${product.image || 'images/placeholder-image.png'}" 
                             alt="${product.name}" 
                             onerror="handleImageError(this)">
                        <div class="image-placeholder" style="display: none;">Image Not Available</div>
                    </div>
                    <h3>${product.name}</h3>
                    <p>${product.description || ''}</p>
                    ${product.specs ? `<div class="specs">${product.specs.replace(/\n/g, '<br>')}</div>` : ''}
                    <div class="price">${product.price || 'اتصل للاستعلام'}</div>
                </div>
            `).join('');
        } else if (container) {
            container.innerHTML = '<p>لا توجد منتجات مميزة حالياً.</p>';
        }
        
        return products;
    } catch (error) {
        console.error('❌ Error loading featured products:', error);
        return [];
    }
}

async function loadProductCategories() {
    try {
        console.log('🔥 Loading product categories from Firestore...');
        
        if (!window.dataManager) {
            console.error('❌ DataManager not available');
            return [];
        }

        // Always get from Firestore first
        const categories = await window.dataManager.getCategoriesFromFirestore();
        console.log(`✅ Loaded ${categories.length} categories from Firestore`);
        
        // Display the categories
        const container = document.getElementById('products-container');
        if (container && categories.length > 0) {
            container.innerHTML = categories.map(category => `
                <div class="category-card" onclick="window.location.href='category.html?categoryId=${category.id}'">
                    <div class="category-image-container">
                        <img src="${category.image || 'images/placeholder-image.png'}" 
                             alt="${category.name}" 
                             onerror="handleImageError(this)">
                        <div class="image-placeholder" style="display: none;">Image Not Available</div>
                    </div>
                    <div class="category-info">
                        <h3>${category.name}</h3>
                        <p>${category.description || ''}</p>
                    </div>
                </div>
            `).join('');
        } else if (container) {
            container.innerHTML = '<p>لا توجد فئات منتجات حالياً.</p>';
        }
        
        return categories;
    } catch (error) {
        console.error('❌ Error loading product categories:', error);
        return [];
    }
}

async function loadCategoryProducts() {
    try {
        console.log('🔥 Loading category products from Firestore...');
        
        if (!window.dataManager) {
            console.error('❌ DataManager not available');
            return [];
        }

        // Get category ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('categoryId');
        
        if (!categoryId) {
            console.error('❌ No category ID provided');
            window.location.href = 'products.html';
            return [];
        }

        // Always get from Firestore first
        const products = await window.dataManager.getProductsFromFirestore();
        console.log(`✅ Loaded ${products.length} products from Firestore`);
        
        // Filter products by category
        const categoryProducts = products.filter(product => product.categoryId === categoryId);
        console.log(`📊 Found ${categoryProducts.length} products for category ${categoryId}`);
        
        // Get category info
        const categories = await window.dataManager.getCategoriesFromFirestore();
        const currentCategory = categories.find(cat => cat.id === categoryId);
        
        // Update page title and description
        if (currentCategory) {
            const titleElement = document.getElementById('category-title');
            const descElement = document.getElementById('category-description');
            
            if (titleElement) titleElement.textContent = currentCategory.name;
            if (descElement) descElement.textContent = currentCategory.description;
        }
        
        // Display the products
        const container = document.getElementById('products-container');
        if (container) {
            if (categoryProducts.length > 0) {
                container.innerHTML = categoryProducts.map(product => `
                    <div class="product-card">
                        <div class="product-image-container">
                            <img src="${product.image || 'images/placeholder-image.png'}" 
                                 alt="${product.name}" 
                                 onerror="handleImageError(this)">
                            <div class="image-placeholder" style="display: none;">Image Not Available</div>
                        </div>
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        ${product.specs ? `<div class="specs">${product.specs.replace(/\n/g, '<br>')}</div>` : ''}
                        <div class="price">${product.price || 'اتصل للاستعلام'}</div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="no-products">
                        <p>لا توجد منتجات في هذه الفئة حالياً.</p>
                        <a href="products.html" class="cta-button">العودة إلى الفئات</a>
                    </div>
                `;
            }
        }
        
        return categoryProducts;
    } catch (error) {
        console.error('❌ Error loading category products:', error);
        return [];
    }
}


// =============================================================
// 🔹 Image Error Handler
// =============================================================
function handleImageError(img) {
    console.log('🖼️ Image failed to load, showing placeholder:', img.src);
    
    const container = img.parentElement;
    if (container) {
        // Hide the broken image
        img.style.display = 'none';
        
        // Show the placeholder text
        const placeholder = container.querySelector('.image-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.height = '200px';
            placeholder.style.background = '#f5f5f5';
            placeholder.style.color = '#666';
            placeholder.style.fontFamily = 'Cairo, sans-serif';
            placeholder.style.fontSize = '16px';
            placeholder.style.border = '1px dashed #ddd';
        }
    }
}


// =============================================================
// 🔹 Preload and Validate Images
// =============================================================
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
    });
}

async function validateAndSetImage(element, imageUrl, fallbackText = 'Image Not Available') {
    try {
        await preloadImage(imageUrl);
        element.src = imageUrl;
        element.style.display = 'block';
        
        // Hide placeholder if it exists
        const placeholder = element.parentElement?.querySelector('.image-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    } catch (error) {
        console.log('❌ Image validation failed, using fallback:', imageUrl);
        handleImageError(element);
    }
}