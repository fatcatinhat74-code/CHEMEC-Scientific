// ===========================================================
// 🔧 NAVIGATION – Compatible with Firestore-based DataManager
// ===========================================================
class Navigation {
    constructor() {
// In navbar.js - Update just the website name part
this.navbarHTML = `
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <a href="index.html" class="logo-link">
                    <div class="logo-container">
                        <img src="images/logo-placeholder.png" alt="logo" class="logo-img" onerror="this.style.display='none'">
                        <h2 id="navbar-website-name"></h2>
                    </div>
                </a>
            </div>
            
            <!-- Rest of the navbar remains the same -->
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="search-input" placeholder="Search Products ..." class="search-input">
                    <button class="search-button" onclick="navigation.performSearch()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </svg>
                    </button>
                </div>
                <div id="search-results" class="search-results"></div>
            </div>
            
            <ul class="nav-menu">
                <li><a href="index.html" class="nav-link">Home</a></li>
                <li><a href="products.html" class="nav-link">Products</a></li>
                <li><a href="about.html" class="nav-link">About Us</a></li>
                <li><a href="#footer-company-description" class="nav-link">Contact Us</a></li>
            </ul>
            <div class="hamburger">
                <span></span><span></span><span></span>
            </div>
        </div>
    </nav>
`;
            this.heroSlideshowHTML = `
            <section class="hero-slideshow">
                <div class="hero-slides-container" id="heroSlidesContainer"></div>
                <div class="hero-content">
                    <h1 id="hero-title">   </h1>
                    <p id="hero-subtitle">    </p>
                 
                </div>
                <div class="slideshow-controls">
                    <button class="slide-prev" onclick="navigation.prevSlide()">‹</button>
                    <button class="slide-next" onclick="navigation.nextSlide()">›</button>
                </div>
                <div class="slideshow-dots" id="slideshowDots"></div>
            </section>
        `;

        this.regularHeroHTML = `
            <section class="hero-regular">
                <div class="hero-background"></div>
                <div class="hero-content">
                    <h1 id="hero-title"></h1>
                    <p id="hero-subtitle"> Discover all products available under this category, with detailed specifications</p>
           
                </div>
            </section>
        `;

        this.currentSlide = 0;
        this.slideshowInterval = null;
        this.slides = [];
        this.footerContent = {};
        this.searchTimeout = null;
        this.allProducts = [];
        this.currentSearchTerm = '';
        this.currentSearchResults = [];
    }

      // =======================================================
    async init() {
        await this.waitForDOM();

        document.body.insertAdjacentHTML('afterbegin', this.navbarHTML);
        this.insertHeroSection();
        await this.waitForDataManager();

        await this.loadFooterContent();
        if (this.isHomepage()) await this.loadSlideshow();

        this.setActiveNavLink();
        this.initMobileMenu();
        this.updateFooterLinks();
        this.initSearch();
        
        console.log('✅ Navigation initialized with search');
    }

    waitForDOM() {
        return new Promise(resolve => {
            if (document.body) resolve();
            else document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    async waitForDataManager() {
        let retries = 0;
        while ((!window.dataManager || !window.dataManager.firebaseInitialized) && retries < 20) {
            await new Promise(res => setTimeout(res, 300));
            retries++;
        }
        if (!window.dataManager) {
            console.warn('⚠️ DataManager not available after waiting');
        }
    }

      navigateToProduct(categoryId) {
        window.location.href = `category.html?categoryId=${categoryId}`;
        this.hideSearchResults();
    }
  // =======================================================
    // Search Functionality
    // =======================================================
    async initSearch() {
        console.log('🔄 Initializing search...');
        await this.loadAllProducts();
        this.setupSearchEventListeners();
        console.log('✅ Search initialized');
    }

    async loadAllProducts() {
        if (!window.dataManager) {
            console.warn('⚠️ DataManager not ready for search');
            return;
        }

        try {
            this.allProducts = await window.dataManager.getProductsFromFirestore();
            console.log(`✅ Loaded ${this.allProducts.length} products for search`);
        } catch (error) {
            console.error('❌ Error loading products for search:', error);
            this.allProducts = [];
        }
    }

    setupSearchEventListeners() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (!searchInput) {
            console.warn('❌ Search input not found');
            return;
        }

        console.log('✅ Setting up search event listeners');

        // Real-time search with debouncing
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });

        // Handle Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });

        // Show all products when focusing on empty search
        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                this.showAllProducts();
            }
        });
    }

    async performSearch(searchTerm = null) {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput || !searchResults) {
            console.warn('❌ Search elements not found');
            return;
        }

        const term = searchTerm || searchInput.value.trim().toLowerCase();
        this.currentSearchTerm = term;
        
        console.log(`🔍 Searching for: "${term}"`);

        if (!term) {
            this.showAllProducts();
            return;
        }

        this.currentSearchResults = this.allProducts.filter(product => 
            product.name?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            product.specs?.toLowerCase().includes(term) ||
            product.categoryId?.toString().includes(term)
        );

        console.log(`📊 Found ${this.currentSearchResults.length} results`);
        this.displaySearchResults(this.currentSearchResults, term);
    }

    showAllProducts() {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (this.allProducts.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No products available ...   </div>';
        } else {
            searchResults.innerHTML = `
                <div class="search-result-header">all products  (${this.allProducts.length})</div>
                ${this.allProducts.slice(0, 5).map(product => this.createSearchResultHTML(product)).join('')}
                ${this.allProducts.length > 5 ? 
                    `<div class="search-result-more">
                        <a href="products.html" class="search-show-all" onclick="navigation.hideSearchResults()">عرض جميع المنتجات</a>
                    </div>` : ''}
            `;
        }
        
        searchResults.classList.add('active');
    }

    displaySearchResults(products, searchTerm) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (products.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-item no-results">
                   No results for "${searchTerm}"
                </div>
            `;
        } else {
            const showAllLink = products.length > 5 ? 
                `<div class="search-result-more">
                    <a href="search-results.html?q=${encodeURIComponent(searchTerm)}" class="search-show-all" onclick="navigation.hideSearchResults()">
                        Show all results (${products.length})
                    </a>
                </div>` : '';

            searchResults.innerHTML = `
                <div class="search-result-header">
                    Search results for "${searchTerm}" (${products.length})
                </div>
                ${products.slice(0, 5).map(product => this.createSearchResultHTML(product)).join('')}
                ${showAllLink}
            `;
        }
        
        searchResults.classList.add('active');
    }

    createSearchResultHTML(product) {
        const categoryName = this.getCategoryName(product.categoryId);
        
        return `
            <div class="product-card" onclick="navigateToproductDetails('${product.id}')">
                <div class="search-result-image">
                    <img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/60'">
                </div>
                <div class="search-result-info">
                    <div class="search-result-name">${product.name}</div>
                    <div class="search-result-category">${categoryName}</div>
                    <div class="search-result-price">${product.price || 'اتصل للاستعلام'}</div>
                </div>
            </div>
        `;
    }

    getCategoryName(categoryId) {
        if (!window.dataManager) return 'عام';
        
        const categories = window.dataManager.getCategories();
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'عام';
    }

  

    hideSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.classList.remove('active');
        }
    }

 // =======================================================
    // Footer
    // =======================================================
    async loadFooterContent() {
        if (!window.dataManager) {
            console.warn('⚠️ DataManager not ready, using default footer');
            this.generateFooterHTML();
            this.insertFooter();
            return;
        }
        this.footerContent = window.dataManager.getFooterContent();
        this.generateFooterHTML();
        this.insertFooter();
    }

  generateFooterHTML() {
    this.footerHTML = `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3 id="footer-company-name">${this.footerContent.companyName || ' '}</h3>
                        <p id="footer-company-description">${this.footerContent.companyDescription || ' '}</p>
                    </div>
                    <div class="footer-section">
                        <h4> Contact Us</h4>
                        <p><strong> Email:</strong> ${this.footerContent.email || 'info@top-steel.com'}</p>
                        <p><strong>Phone:</strong> ${this.footerContent.phone || ''}</p>
                        <p><strong>Address:</strong> ${this.footerContent.address || ''}</p>
                    </div>
                    <div class="footer-section">
                        <h4>Hyperlinks </h4>
                        <ul>
                            <li><a href="index.html">HOME</a></li>
                            <li><a href="products.html">PRODUCTS</a></li>
                            <li><a href="about.html">About Us</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Social Media </h4>
                        <ul>
                            ${this.footerContent.facebook ? `
                                <li><a href="${this.footerContent.facebook}" target="_blank" class="social-link">Facebook</a></li>
                            ` : ''}
                            ${this.footerContent.whatsapp ? `
                                <li><a href="https://wa.me/${this.footerContent.whatsapp}" target="_blank" class="social-link">WhatsApp</a></li>
                            ` : ''}
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>
                        <a href="https://linktr.ee/aaeliwa" target="blank" class="copyright-link">
                            Developed by Abdelrhman A. Eliwa © 2025
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    `;
}

    insertFooter() {
        document.body.insertAdjacentHTML('beforeend', this.footerHTML);
    }

    // =======================================================
    // Hero section & slides
    // =======================================================

    goToSlide(slideIndex) {
        if (!this.isHomepage()) return;
        const activeSlides = this.slides.filter(s => s.active);
        if (slideIndex < 0 || slideIndex >= activeSlides.length) return;

        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        
        slides[this.currentSlide].classList.remove('active');
        dots[this.currentSlide].classList.remove('active');

        this.currentSlide = slideIndex;
        slides[this.currentSlide].classList.add('active');
        dots[this.currentSlide].classList.add('active');
        this.updateSlideContent(this.currentSlide);
        this.restartSlideshow();
    }

     isHomepage() {
        const page = this.getCurrentPage();
        return page === 'index.html' || page === '' || page === '/';
    }

    insertHeroSection() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        if (this.isHomepage()) navbar.insertAdjacentHTML('afterend', this.heroSlideshowHTML);
        else {
            navbar.insertAdjacentHTML('afterend', this.regularHeroHTML);
            this.updatePageHeroContent();
        }
    }

    async loadSlideshow() {
        if (!window.dataManager) return;

        const savedSlides = await window.dataManager.getSlides();
        this.slides = Array.isArray(savedSlides) ? savedSlides : [];

        if (this.slides.length === 0) {
            this.slides = [{
                id: 1,
                image: 'https://images.unsplash.com/photo-1581094794322-7c6dceeecb91?auto=format&fit=crop&w=2070&q=80',
                title: '   ',
                subtitle: ' ',
                active: true
            }];
        }

        this.renderSlideshow();
        this.startSlideshow();
    }

    renderSlideshow() {
        const container = document.getElementById('heroSlidesContainer');
        const dotsContainer = document.getElementById('slideshowDots');
        if (!container) return;

        const activeSlides = this.slides.filter(s => s.active);
        if (activeSlides.length === 0) {
            container.innerHTML = `<div class="hero-slide active"><div class="slide-background" style="background-image:url('https://images.unsplash.com/photo-1581094794322-7c6dceeecb91?w=800')"></div></div>`;
            dotsContainer.innerHTML = '<span class="dot active"></span>';
            return;
        }

        container.innerHTML = activeSlides.map((s, i) => `
            <div class="hero-slide ${i === 0 ? 'active' : ''}">
                <div class="slide-background" style="background-image:url('${s.image}')"></div>
            </div>`).join('');

        dotsContainer.innerHTML = activeSlides.map((s, i) =>
            `<span class="dot ${i === 0 ? 'active' : ''}" onclick="navigation.goToSlide(${i})"></span>`
        ).join('');

        this.updateSlideContent(0);
    }

    updateSlideContent(i) {
        const actives = this.slides.filter(s => s.active);
        if (!actives[i]) return;
        document.getElementById('hero-title').textContent = actives[i].title;
        document.getElementById('hero-subtitle').textContent = actives[i].subtitle;
    }

    nextSlide() { this.moveSlide(1); }
    prevSlide() { this.moveSlide(-1); }

    moveSlide(step) {
        if (!this.isHomepage()) return;
        const activeSlides = this.slides.filter(s => s.active);
        if (activeSlides.length <= 1) return;

        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        slides[this.currentSlide].classList.remove('active');
        dots[this.currentSlide].classList.remove('active');

        this.currentSlide = (this.currentSlide + step + activeSlides.length) % activeSlides.length;
        slides[this.currentSlide].classList.add('active');
        dots[this.currentSlide].classList.add('active');
        this.updateSlideContent(this.currentSlide);
        this.restartSlideshow();
    }

    startSlideshow() {
        if (!this.isHomepage()) return;
        const activeSlides = this.slides.filter(s => s.active);
        if (activeSlides.length <= 1) return;
        this.slideshowInterval = setInterval(() => this.nextSlide(), 5000);
    }

    restartSlideshow() {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.startSlideshow();
        }
    }

    stopSlideshow() {
        if (this.slideshowInterval) clearInterval(this.slideshowInterval);
    }

     // =======================================================
    // Utility
    // =======================================================
// In navbar.js - Replace the updatePageHeroContent method
updatePageHeroContent() {
    const page = this.getCurrentPage();
    const title = document.getElementById('hero-title');
    const sub = document.getElementById('hero-subtitle');
    const btn = document.querySelector('.hero-content .cta-button');
    
    if (!title || !window.dataManager) return;

    // Get content from DataManager instead of hardcoded values
    const content = window.dataManager.getContent();
    
  const pageData = {
        'about.html': {
            title: content['page-about-title'] || 'من نحن',
            desc: content['page-about-desc'] || 'تعرف على تاريخنا، مهمتنا، والتزامنا بالتميز'
        },
        'products.html': {
            title: content['page-products-title'] || 'منتجاتنا',
            desc: content['page-products-desc'] || 'استكشف مجموعة حلول أنابيب الصلب الشاملة لدينا'
        },
        'achievements.html': {
            title: content['page-achievements-title'] || 'إنجازاتنا',
            desc: content['page-achievements-desc'] || 'الاحتفاء بمعالمنا والتقدير في صناعة أنابيب الصلب'
        },
        'admin.html': {
            title: content['page-admin-title'] || 'لوحة التحكم',
            desc: content['page-admin-desc'] || 'إدارة محتوى موقع توب ستيل'
        }
    };
    
    if (pageData[page]) {
        title.textContent = pageData[page].title;
        sub.textContent = pageData[page].desc;
        if (btn) btn.style.display = 'none';
        
        console.log('✅ Updated page hero content for:', page);
    }
}

    getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    setActiveNavLink() {
        const page = this.getCurrentPage();
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === page);
        });
    }

    updateFooterLinks() {
        const page = this.getCurrentPage();
        document.querySelectorAll('.footer-section a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === page) {
                link.style.color = '#3498db';
                link.style.fontWeight = '600';
            }
        });
    }

    initMobileMenu() {
        const burger = document.querySelector('.hamburger');
        const menu = document.querySelector('.nav-menu');
        if (!burger || !menu) return;

        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            menu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(l =>
            l.addEventListener('click', () => {
                burger.classList.remove('active');
                menu.classList.remove('active');
            })
        );

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                burger.classList.remove('active');
                menu.classList.remove('active');
            }
        });
    }
}

// ===========================================================
// Initialize navigation after DOM ready
// ===========================================================
document.addEventListener('DOMContentLoaded', async () => {
    window.navigation = new Navigation();
    await window.navigation.init();
});