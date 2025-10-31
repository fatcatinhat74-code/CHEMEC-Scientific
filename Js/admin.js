// ===========================================================
// 🔧 ADMIN PANEL – FIRESTORE COMPATIBLE VERSION
// ===========================================================
class AdminPanel {
    constructor() {
        this.dataManager = window.dataManager;
        this.isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        this.currentEditingId = null;
        this.initializeAdmin();
        
        // Debug content loading
        setTimeout(() => this.debugContentLoading(), 2000);
    }

    // =======================================================
    // Initialization
    // =======================================================
    initializeAdmin() {
        if (this.isLoggedIn) this.showDashboard();
        else this.showLogin();

        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

        document.querySelectorAll('.tab-button').forEach(btn =>
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab))
        );

        this.setupFormSubmissions();
    }

    setupFormSubmissions() {
        const forms = {
            'home-content-form': (e) => this.handleContentUpdate(e, 'home'),
            'page-headers-content-form': (e) => this.handleContentUpdate(e, 'page-headers'),
            'add-slide-form': (e) => this.handleAddSlide(e),
            'about-content-form': (e) => this.handleContentUpdate(e, 'about'),
            'achievements-content-form': (e) => this.handleContentUpdate(e, 'achievements'),
            'add-category-form': (e) => this.handleAddCategory(e),
            'add-product-form': (e) => this.handleAddProduct(e),
            'footer-content-form': (e) => this.handleFooterContentUpdate(e)
        };

        Object.entries(forms).forEach(([id, handler]) => {
            const form = document.getElementById(id);
            if (form) {
                form.addEventListener('submit', handler);
                console.log(`✅ Form handler attached: ${id}`);
            } else {
                console.warn(`❌ Form not found: ${id}`);
            }
        });
    }

    // =======================================================
    // Authentication
    // =======================================================
    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const creds = JSON.parse(localStorage.getItem('adminCredentials'));

        if (creds && username === creds.username && password === creds.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            this.isLoggedIn = true;
            this.showDashboard();
            this.showSuccess('تم تسجيل الدخول بنجاح!');
        } else {
            alert('بيانات الاعتماد غير صالحة!');
        }
    }

    handleLogout() {
        localStorage.setItem('adminLoggedIn', 'false');
        this.isLoggedIn = false;
        this.showLogin();
        this.showSuccess('تم تسجيل الخروج بنجاح!');
    }

    showLogin() {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
    }

    // =======================================================
    // Tabs
    // =======================================================
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

        document.getElementById(tabName)?.classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        if (tabName === 'categories') this.loadCategoriesList();
        else if (tabName === 'products') {
            this.loadProductsList();
            this.populateCategoryDropdown();
        } else if (tabName === 'hero-slideshow') this.loadSlidesList();
        else if (tabName === 'footer-content') this.loadFooterContentForm();
        
        console.log(`✅ Switched to tab: ${tabName}`);
    }

    // =======================================================
    // Data loading
    // =======================================================
    async loadData() {
        await this.loadContentForms();
        await this.loadCategoriesList();
        await this.loadProductsList();
        await this.populateCategoryDropdown();
        await this.loadFooterContentForm();
        await this.loadSlidesList();
    }

async loadContentForms() {
    if (!this.dataManager) {
        console.warn('❌ DataManager not available');
        return;
    }
    
    const content = this.dataManager.getContent();
    console.log('📦 Loading content from storage:', content);
    
    // Load ALL content fields including page headers and services
    const contentFields = [
        // Home content
        'website-name', 'hero-title', 'hero-subtitle', 
        'intro-title', 'intro-text', 'services-title',
        'service-1-title', 'service-1-desc',
        'service-2-title', 'service-2-desc', 
        'service-3-title', 'service-3-desc',
        
        // Page headers content - ABOUT PAGE HERO FIELDS
        'page-about-title', 'page-about-desc',
        'page-products-title', 'page-products-desc', 
        'page-achievements-title', 'page-achievements-desc',
        'page-admin-title', 'page-admin-desc',
        
        // About page content
        'about-history-title', 'about-history-text',
        'about-mission-title', 'about-mission-text',
        'about-vision-title', 'about-vision-text',
        
        // Achievements content
        'projects-title', 'certifications-title', 'milestones-title'
    ];
    
    let loadedCount = 0;
    contentFields.forEach(key => {
        // Try multiple selectors to find the input
        const input = document.querySelector(`[data-key="${key}"]`) || 
                     document.getElementById(`${key}-input`);
        
        if (input && content[key] !== undefined) {
            input.value = content[key] || '';
            loadedCount++;
            console.log(`✅ Loaded ${key}:`, content[key]);
        } else if (!input) {
            console.warn(`❌ Input not found for key: ${key}`);
        } else if (content[key] === undefined) {
            console.warn(`ℹ️ No content found for key: ${key}`);
        }
    });
    
    console.log(`📊 Successfully loaded ${loadedCount} content fields`);
    
    // Debug: Check specific services fields
    this.debugServicesLoading(content);
}

// Add this method to the AdminPanel class
debugServicesLoading(content) {
    console.log('🔧 DEBUG: Checking services content loading...');
    
    const servicesFields = [
        'services-title',
        'service-1-title', 'service-1-desc',
        'service-2-title', 'service-2-desc', 
        'service-3-title', 'service-3-desc'
    ];
    
    servicesFields.forEach(key => {
        const input = document.querySelector(`[data-key="${key}"]`);
        console.log(`🔍 ${key}:`, {
            inputExists: !!input,
            inputId: input?.id,
            inputValue: input?.value,
            storedValue: content[key],
            matches: input?.value === content[key]
        });
    });
}

    // =======================================================
    // Content & Footer
    // =======================================================
    async handleContentUpdate(e, page) {
        e.preventDefault();
        
        if (!this.dataManager) {
            alert('❌ DataManager not available');
            return;
        }

        const updates = {};
        const form = e.target;
        
        // Collect all data-key inputs from the form
        form.querySelectorAll('[data-key]').forEach(input => {
            updates[input.dataset.key] = input.value;
        });

        console.log(`📝 Updating content for ${page}:`, updates);

        try {
            await this.dataManager.updateMultipleContent(updates);
            
            // Force immediate content refresh
            if (typeof updateWebsiteContent === 'function') {
                updateWebsiteContent();
            }
            
            this.showSuccess('✅ تم تحديث المحتوى بنجاح!');
            
            // Reload the form to show updated values
            setTimeout(() => this.loadContentForms(), 500);
            
        } catch (error) {
            console.error('❌ Error updating content:', error);
            alert('❌ فشل في تحديث المحتوى: ' + error.message);
        }
    }

    async handleFooterContentUpdate(e) {
        e.preventDefault();
        const updates = {};
        e.target.querySelectorAll('[data-key]').forEach(i => updates[i.dataset.key] = i.value);
        
        console.log('📝 Updating footer content:', updates);
        
        await this.dataManager.updateFooterContent(updates);
        this.showSuccess('تم تحديث محتوى التذييل بنجاح!');
    }

 loadFooterContentForm() {
    if (!this.dataManager) {
        console.warn('❌ DataManager not available for footer content');
        return;
    }
    
    const footer = this.dataManager.getFooterContent();
    console.log('📦 Loading footer content:', footer);
    
    // Load editable fields including WhatsApp
    const editableFields = ['companyName', 'companyDescription', 'email', 'phone', 'address', 'facebook', 'whatsapp'];
    
    editableFields.forEach(key => {
        const input = document.getElementById(`footer-${key}-input`);
        if (input) {
            input.value = footer[key] || '';
            console.log(`✅ Loaded footer.${key}:`, footer[key]);
        } else {
            console.warn(`❌ Footer input not found: footer-${key}-input`);
        }
    });
}

    // =======================================================
    // Slides
    // =======================================================
    async loadSlidesList() {
        const container = document.getElementById('slides-list-container');
        if (!container || !this.dataManager) {
            console.warn('❌ Slides container or DataManager not available');
            return;
        }

        const slides = await this.dataManager.getSlides();
        console.log('📦 Loading slides:', slides);
        
        if (!Array.isArray(slides) || slides.length === 0) {
            container.innerHTML = '<p>لا توجد شرائح حالياً.</p>';
            return;
        }

        container.innerHTML = slides.map(slide => `
            <div class="slide-item ${slide.active ? '' : 'inactive'}">
                <div class="slide-preview">
                    <img src="${slide.image}" alt="${slide.title}" class="slide-image"
                        onerror="this.src='https://images.unsplash.com/photo-1581094794322-7c6dceeecb91?w=400&h=250&fit=crop'">
                    <div class="slide-info">
                        <h5>${slide.title}</h5>
                        <p>${slide.subtitle}</p>
                        <span class="slide-status ${slide.active ? 'active' : 'inactive'}">
                            ${slide.active ? 'نشطة' : 'غير نشطة'}
                        </span>
                    </div>
                </div>
                <div class="slide-actions">
                    <button class="toggle-slide-btn ${slide.active ? '' : 'inactive'}"
                        onclick="admin.toggleSlide('${slide.id}')">${slide.active ? 'تعطيل' : 'تفعيل'}</button>
                    <button class="edit-btn" onclick="admin.editSlide('${slide.id}')">تعديل</button>
                    <button class="delete-btn" onclick="admin.deleteSlide('${slide.id}')">حذف</button>
                </div>
            </div>`).join('');
            
        console.log(`✅ Loaded ${slides.length} slides`);
    }

    async handleAddSlide(e) {
        e.preventDefault();
        const slide = {
            image: document.getElementById('slide-image').value,
            title: document.getElementById('slide-title').value,
            subtitle: document.getElementById('slide-subtitle').value,
            active: document.getElementById('slide-active').checked
        };
        
        console.log('📝 Adding new slide:', slide);
        
        await this.dataManager.addSlide(slide);
        this.safeFormReset('add-slide-form');
        await this.loadSlidesList();
        this.showSuccess('تم إضافة الشريحة بنجاح!');
    }

    async toggleSlide(id) {
        const slides = await this.dataManager.getSlides();
        const slide = slides.find(s => s.id == id);
        if (slide) {
            slide.active = !slide.active;
            await this.dataManager.updateSlide(id, slide);
            await this.loadSlidesList();
            this.showSuccess('تم تحديث حالة الشريحة!');
        }
    }

    async editSlide(id) {
        const slides = await this.dataManager.getSlides();
        const slide = slides.find(s => s.id == id);
        if (!slide) return;

        document.getElementById('slide-image').value = slide.image;
        document.getElementById('slide-title').value = slide.title;
        document.getElementById('slide-subtitle').value = slide.subtitle;
        document.getElementById('slide-active').checked = slide.active;

        const btn = document.querySelector('#add-slide-form button');
        btn.textContent = 'تحديث الشريحة';
        btn.onclick = (e) => this.handleUpdateSlide(e, id);
        this.showSuccess('تم تحميل الشريحة للتعديل.');
    }

    async handleUpdateSlide(e, id) {
        e.preventDefault();
        const slide = {
            image: document.getElementById('slide-image').value,
            title: document.getElementById('slide-title').value,
            subtitle: document.getElementById('slide-subtitle').value,
            active: document.getElementById('slide-active').checked
        };
        
        console.log(`📝 Updating slide ${id}:`, slide);
        
        await this.dataManager.updateSlide(id, slide);
        this.resetSlideForm();
        await this.loadSlidesList();
        this.showSuccess('تم تحديث الشريحة بنجاح!');
    }

    async deleteSlide(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذه الشريحة؟')) {
            await this.dataManager.deleteSlide(id);
            await this.loadSlidesList();
            this.showSuccess('تم حذف الشريحة بنجاح!');
        }
    }

    resetSlideForm() {
        const form = document.getElementById('add-slide-form');
        form?.reset();
        const btn = form?.querySelector('button');
        if (btn) {
            btn.textContent = 'إضافة شريحة';
            btn.onclick = (e) => this.handleAddSlide(e);
        }
    }

    safeFormReset(id) {
        const f = document.getElementById(id);
        if (f?.reset) f.reset();
    }

    // =======================================================
    // Categories
    // =======================================================
    // Add this method to load categories with images
async loadCategoriesList() {
    const container = document.getElementById('categories-list-container');
    if (!container || !this.dataManager) {
        console.warn('❌ Categories container or DataManager not available');
        return;
    }

    const categories = this.dataManager.getCategories();
    console.log('📦 Loading categories:', categories);
    
    if (!Array.isArray(categories) || categories.length === 0) {
        container.innerHTML = '<p>لا توجد فئات حالياً.</p>';
        return;
    }

    container.innerHTML = categories.map(c => `
        <div class="category-item">
            <div class="category-info">
                <div class="category-preview">
                    <div class="category-image-container">
                        <img src="${c.image || 'images/placeholder-image.png'}" 
                             alt="${c.name}" 
                             class="category-image"
                             onerror="admin.handleAdminImageError(this)">
                        <div class="image-placeholder" style="display: none;">No Image</div>
                    </div>
                    <div class="category-details">
                        <h4>${c.name}</h4>
                        <p>${c.description}</p>
                    </div>
                </div>
            </div>
            <div class="category-actions">
                <button class="edit-btn" onclick="admin.editCategory('${c.id}')">تعديل</button>
                <button class="delete-btn" onclick="admin.deleteCategory('${c.id}')">حذف</button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Loaded ${categories.length} categories`);
}


    async handleAddCategory(e) {
        e.preventDefault();
        const category = {
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value,
            image: document.getElementById('category-image').value
        };
        
        console.log('📝 Adding new category:', category);
        
        await this.dataManager.addCategory(category);
        this.safeFormReset('add-category-form');
        await this.loadCategoriesList();
        await this.populateCategoryDropdown();
        this.showSuccess('تم إضافة الفئة بنجاح!');
    }

    async editCategory(id) {
        const cats = this.dataManager.getCategories();
        const cat = cats.find(c => c.id == id);
        if (!cat) return;
        
        document.getElementById('category-name').value = cat.name;
        document.getElementById('category-description').value = cat.description;
        document.getElementById('category-image').value = cat.image;

        this.currentEditingId = id;
        const btn = document.querySelector('#add-category-form button');
        btn.textContent = 'تحديث الفئة';
        btn.onclick = (e) => this.handleUpdateCategory(e, id);
        this.showSuccess('تم تحميل الفئة للتعديل.');
    }

    async handleUpdateCategory(e, id) {
        e.preventDefault();
        const updated = {
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value,
            image: document.getElementById('category-image').value
        };
        
        console.log(`📝 Updating category ${id}:`, updated);
        
        await this.dataManager.updateCategory(id, updated);
        this.resetCategoryForm();
        await this.loadCategoriesList();
        await this.populateCategoryDropdown();
        this.showSuccess('تم تحديث الفئة بنجاح!');
    }

    resetCategoryForm() {
        const f = document.getElementById('add-category-form');
        f?.reset();
        const btn = f?.querySelector('button');
        if (btn) {
            btn.textContent = 'إضافة فئة';
            btn.onclick = (e) => this.handleAddCategory(e);
        }
        this.currentEditingId = null;
    }

    async deleteCategory(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذه الفئة؟')) {
            await this.dataManager.deleteCategory(id);
            await this.loadCategoriesList();
            await this.populateCategoryDropdown();
            this.showSuccess('تم حذف الفئة بنجاح!');
        }
    }

    async populateCategoryDropdown() {
        const dropdown = document.getElementById('product-category');
        if (!dropdown || !this.dataManager) {
            console.warn('❌ Category dropdown or DataManager not available');
            return;
        }
        
        const cats = this.dataManager.getCategories();
        dropdown.innerHTML = '<option value="">اختر فئة</option>' +
            cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            
        console.log(`✅ Populated category dropdown with ${cats.length} categories`);
    }

    // =======================================================
    // Products
    // =======================================================
async loadProductsList() {
    const container = document.getElementById('products-list-container');
    if (!container || !this.dataManager) {
        console.warn('❌ Products container or DataManager not available');
        return;
    }

    const prods = this.dataManager.getProducts();
    const cats = this.dataManager.getCategories();
    console.log('📦 Loading products:', prods);
    
    if (!Array.isArray(prods) || prods.length === 0) {
        container.innerHTML = '<p>لا توجد منتجات حالياً.</p>';
        return;
    }

    container.innerHTML = prods.map(p => {
        const cat = cats.find(c => c.id == p.categoryId);
        return `
        <div class="product-item">
            <div class="product-info">
                <div class="product-preview">
                    <div class="product-image-container">
                        <img src="${p.image || 'images/placeholder-image.png'}" 
                             alt="${p.name}" 
                             class="product-image"
                             onerror="admin.handleAdminImageError(this)">
                        <div class="image-placeholder" style="display: none;">No Image</div>
                    </div>
                    <div class="product-details">
                        <h4>${p.name}</h4>
                        <p>${p.description}</p>
                        <small><strong>الفئة:</strong> ${cat ? cat.name : 'غير معروفة'}</small>
                        <div class="product-price">${p.price}</div>
                    </div>
                </div>
            </div>
            <div class="product-actions">
                <button class="edit-btn" onclick="admin.editProduct('${p.id}')">تعديل</button>
                <button class="delete-btn" onclick="admin.deleteProduct('${p.id}')">حذف</button>
            </div>
        </div>`;
    }).join('');
    
    console.log(`✅ Loaded ${prods.length} products`);
}

// Add image error handler for admin panel
handleAdminImageError(img) {
    console.log('🖼️ Admin image failed to load:', img.src);
    
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
            placeholder.style.height = '60px';
            placeholder.style.background = '#f5f5f5';
            placeholder.style.color = '#666';
            placeholder.style.fontFamily = 'Cairo, sans-serif';
            placeholder.style.fontSize = '12px';
            placeholder.style.border = '1px dashed #ddd';
            placeholder.style.borderRadius = '4px';
        }
    }
}

    async handleAddProduct(e) {
        e.preventDefault();
        const product = {
            categoryId: document.getElementById('product-category').value,
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            specs: document.getElementById('product-specs').value,
            price: document.getElementById('product-price').value,
            image: document.getElementById('product-image').value
        };
        
        console.log('📝 Adding new product:', product);
        
        await this.dataManager.addProduct(product);
        this.safeFormReset('add-product-form');
        await this.loadProductsList();
        this.showSuccess('تم إضافة المنتج بنجاح!');
    }

    async editProduct(id) {
        const prods = this.dataManager.getProducts();
        const p = prods.find(pr => pr.id == id);
        if (!p) return;

        document.getElementById('product-category').value = p.categoryId;
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-description').value = p.description;
        document.getElementById('product-specs').value = p.specs;
        document.getElementById('product-price').value = p.price.replace(' جنيه', '');
        document.getElementById('product-image').value = p.image;

        this.currentEditingId = id;
        const btn = document.querySelector('#add-product-form button');
        btn.textContent = 'تحديث المنتج';
        btn.onclick = (e) => this.handleUpdateProduct(e, id);
        this.showSuccess('تم تحميل المنتج للتعديل.');
    }

    async handleUpdateProduct(e, id) {
        e.preventDefault();
        const updated = {
            categoryId: document.getElementById('product-category').value,
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            specs: document.getElementById('product-specs').value,
            price: document.getElementById('product-price').value,
            image: document.getElementById('product-image').value
        };
        
        console.log(`📝 Updating product ${id}:`, updated);
        
        await this.dataManager.updateProduct(id, updated);
        this.resetProductForm();
        await this.loadProductsList();
        this.showSuccess('تم تحديث المنتج بنجاح!');
    }

    resetProductForm() {
        const f = document.getElementById('add-product-form');
        f?.reset();
        const btn = f?.querySelector('button');
        if (btn) {
            btn.textContent = 'إضافة منتج';
            btn.onclick = (e) => this.handleAddProduct(e);
        }
        this.currentEditingId = null;
    }

    async deleteProduct(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
            await this.dataManager.deleteProduct(id);
            await this.loadProductsList();
            this.showSuccess('تم حذف المنتج بنجاح!');
        }
    }

    // =======================================================
    // Debug & UI Helpers
    // =======================================================
    debugContentLoading() {
        console.log('🐛 DEBUG: Checking content loading...');
        
        if (!this.dataManager) {
            console.warn('❌ DataManager not available for debug');
            return;
        }
        
        const content = this.dataManager.getContent();
        console.log('📦 Current content in storage:', content);
        
        // Test specific about page fields
        const testFields = [
            'page-about-title', 'page-about-desc', 
            'about-history-title', 'about-history-text',
            'website-name', 'hero-title'
        ];
        
        testFields.forEach(key => {
            const input = document.querySelector(`[data-key="${key}"]`);
            console.log(`🔍 ${key}:`, {
                inputExists: !!input,
                inputValue: input?.value,
                storedValue: content[key],
                matches: input?.value === content[key]
            });
        });
    }

    showSuccess(msg) {
        const div = document.createElement('div');
        div.className = 'success-message';
        div.textContent = msg;
        div.style.cssText = `
            background:#4CAF50;color:#fff;padding:15px;margin:10px 0;
            border-radius:5px;text-align:center;font-family:'Cairo',sans-serif;
        `;
        const container = document.querySelector('.admin-container');
        if (container) {
            container.insertBefore(div, container.firstChild);
            setTimeout(() => div.remove(), 4000);
        }
    }
}

// ===========================================================
// Initialize Admin
// ===========================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Admin Panel...');
    window.admin = new AdminPanel();
});