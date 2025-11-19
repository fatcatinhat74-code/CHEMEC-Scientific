// ===========================================================
// 🔧 ADMIN PANEL – ENGLISH + FIRESTORE
// ===========================================================
class AdminPanel {
  constructor() {
    this.dataManager = window.dataManager;
    this.isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    this.currentEditingId = null;
    this.initializeAdmin();
    setTimeout(() => this.debugContentLoading(), 1500);
  }

  initializeAdmin() {
    if (this.isLoggedIn) this.showDashboard(); else this.showLogin();
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
      if (form) form.addEventListener('submit', handler);
    });
  }

  // =======================================================
  // Enhanced Edit Functions with Auto-Scroll
  // =======================================================

  async scrollToFormAndFocus(formId, firstInputId = null) {
    // Wait a brief moment for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const form = document.getElementById(formId);
    if (form) {
      // Scroll to the form smoothly
      form.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
      
      // Focus on the first input field if specified
      if (firstInputId) {
        const firstInput = document.getElementById(firstInputId);
        if (firstInput) {
          setTimeout(() => {
            firstInput.focus();
            firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      }
    }
  }

  // Auth
  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const creds = JSON.parse(localStorage.getItem('adminCredentials'));
    if (creds && username === creds.username && password === creds.password) {
      localStorage.setItem('adminLoggedIn', 'true');
      this.isLoggedIn = true;
      this.showDashboard();
      this.toast('Logged in successfully');
    } else {
      alert('Invalid credentials!');
    }
  }

  handleLogout() {
    localStorage.setItem('adminLoggedIn', 'false');
    this.isLoggedIn = false;
    this.showLogin();
    this.toast('Logged out successfully');
  }

  showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
  }

  // Tabs
  switchTab(tabName) {
    // Hide all tab contents and remove active classes
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    // Show the selected tab and add active class
    document.getElementById(tabName)?.classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Load appropriate data for the tab
    if (tabName === 'categories') this.loadCategoriesList();
    else if (tabName === 'products') { 
      this.loadProductsList(); 
      this.populateCategoryDropdown(); 
    }
    else if (tabName === 'hero-slideshow') this.loadSlidesList();
    else if (tabName === 'footer-content') this.loadFooterContentForm();
    
    // Scroll to top of the tab content smoothly
    setTimeout(() => {
      const tabContent = document.getElementById(tabName);
      if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Data loading
  async loadData() {
    await this.loadContentForms();
    await this.loadCategoriesList();
    await this.loadProductsList();
    await this.populateCategoryDropdown();
    await this.loadFooterContentForm();
    await this.loadSlidesList();
  }

  async loadContentForms() {
    if (!this.dataManager) return;
    const content = this.dataManager.getContent();
    const contentFields = [
      'website-name','hero-title','hero-subtitle',
      'intro-title','intro-text','services-title',
      'service-1-title','service-1-desc',
      'service-2-title','service-2-desc',
      'service-3-title','service-3-desc',
      'page-about-title','page-about-desc',
      'page-products-title','page-products-desc',
      'page-achievements-title','page-achievements-desc',
      'page-admin-title','page-admin-desc',
      'about-history-title','about-history-text',
      'about-mission-title','about-mission-text',
      'about-vision-title','about-vision-text',
      'projects-title','certifications-title','milestones-title'
    ];
    contentFields.forEach(key => {
      const input = document.querySelector(`[data-key="${key}"]`) || document.getElementById(`${key}-input`);
      if (input) input.value = content[key] || '';
    });
  }

  // Content & Footer
  async handleContentUpdate(e, page) {
    e.preventDefault();
    if (!this.dataManager) { alert('DataManager not available'); return; }
    const updates = {};
    e.target.querySelectorAll('[data-key]').forEach(input => updates[input.dataset.key] = input.value);
    await this.dataManager.updateMultipleContent(updates);
    this.toast('Content saved');
    setTimeout(() => this.loadContentForms(), 300);
  }

  async handleFooterContentUpdate(e) {
    e.preventDefault();
    const updates = {};
    e.target.querySelectorAll('[data-key]').forEach(i => updates[i.dataset.key] = i.value);
    await this.dataManager.updateFooterContent(updates);
    this.toast('Footer saved');
  }

  loadFooterContentForm() {
    if (!this.dataManager) return;
    const footer = this.dataManager.getFooterContent();
    const editableFields = ['companyName','companyDescription','email','phone','address','facebook','whatsapp'];
    editableFields.forEach(key => {
      const input = document.getElementById(`footer-${key}-input`);
      if (input) input.value = footer[key] || '';
    });
  }

  // Slides
  async loadSlidesList() {
    const container = document.getElementById('slides-list-container');
    if (!container || !this.dataManager) return;
    const slides = await this.dataManager.getSlides();
    if (!Array.isArray(slides) || slides.length === 0) {
      container.innerHTML = '<p>No slides yet.</p>';
      return;
    }
    container.innerHTML = slides.map(slide => `
      <div class="slide-item ${slide.active ? '' : 'inactive'}">
        <div class="slide-preview">
          <img src="${slide.image}" alt="${slide.title}" class="slide-image" onerror="this.src='https://via.placeholder.com/400x250'">
          <div class="slide-info">
            <h5>${slide.title}</h5>
            <p>${slide.subtitle}</p>
            <span class="slide-status ${slide.active ? 'active' : 'inactive'}">${slide.active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <div class="slide-actions">
          <button class="toggle-slide-btn ${slide.active ? '' : 'inactive'}" onclick="admin.toggleSlide('${slide.id}')">${slide.active ? 'Disable' : 'Enable'}</button>
          <button class="edit-btn" onclick="admin.editSlide('${slide.id}')">Edit</button>
          <button class="delete-btn" onclick="admin.deleteSlide('${slide.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  async handleAddSlide(e) {
    e.preventDefault();
    const slide = {
      image: document.getElementById('slide-image').value,
      title: document.getElementById('slide-title').value,
      subtitle: document.getElementById('slide-subtitle').value,
      active: document.getElementById('slide-active').checked
    };
    await this.dataManager.addSlide(slide);
    this.safeFormReset('add-slide-form');
    await this.loadSlidesList();
    this.toast('Slide added');
  }

  async toggleSlide(id) {
    const slides = await this.dataManager.getSlides();
    const slide = slides.find(s => s.id == id);
    if (slide) {
      slide.active = !slide.active;
      await this.dataManager.updateSlide(id, slide);
      await this.loadSlidesList();
      this.toast('Slide status updated');
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
    btn.textContent = 'Update slide';
    btn.onclick = (e) => this.handleUpdateSlide(e, id);
    
    // Switch to hero-slideshow tab and scroll to form
    this.switchTab('hero-slideshow');
    await this.scrollToFormAndFocus('add-slide-form', 'slide-image');
    
    this.toast('Slide loaded for editing - scroll to form');
  }

  async handleUpdateSlide(e, id) {
    e.preventDefault();
    const slide = {
      image: document.getElementById('slide-image').value,
      title: document.getElementById('slide-title').value,
      subtitle: document.getElementById('slide-subtitle').value,
      active: document.getElementById('slide-active').checked
    };
    await this.dataManager.updateSlide(id, slide);
    this.resetSlideForm();
    await this.loadSlidesList();
    this.toast('Slide updated');
  }

  async deleteSlide(id) {
    if (confirm('Delete this slide?')) {
      await this.dataManager.deleteSlide(id);
      await this.loadSlidesList();
      this.toast('Slide deleted');
    }
  }

  resetSlideForm() {
    const form = document.getElementById('add-slide-form');
    form?.reset();
    const btn = form?.querySelector('button');
    if (btn) {
      btn.textContent = 'Add slide';
      btn.onclick = (e) => this.handleAddSlide(e);
    }
  }

  safeFormReset(id) {
    const f = document.getElementById(id);
    if (f?.reset) f.reset();
  }

  // Categories
  async loadCategoriesList() {
    const container = document.getElementById('categories-list-container');
    if (!container || !this.dataManager) return;
    const categories = this.dataManager.getCategories();
    if (!Array.isArray(categories) || categories.length === 0) {
      container.innerHTML = '<p>No categories yet.</p>';
      return;
    }
    container.innerHTML = categories.map(c => `
      <div class="category-item">
        <div class="category-info">
          <div class="category-preview">
            <div class="category-image-container">
              <img src="${c.image || 'images/placeholder-image.png'}" alt="${c.name}" class="category-image" onerror="admin.handleAdminImageError(this)">
              <div class="image-placeholder" style="display:none;">No Image</div>
            </div>
            <div class="category-details">
              <h4>${c.name}</h4>
              <p>${c.description || ''}</p>
            </div>
          </div>
        </div>
        <div class="category-actions">
          <button class="edit-btn" onclick="admin.editCategory('${c.id}')">Edit</button>
          <button class="delete-btn" onclick="admin.deleteCategory('${c.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  async handleAddCategory(e) {
    e.preventDefault();
    const category = {
      name: document.getElementById('category-name').value,
      description: document.getElementById('category-description').value,
      image: document.getElementById('category-image').value
    };
    await this.dataManager.addCategory(category);
    this.safeFormReset('add-category-form');
    await this.loadCategoriesList();
    await this.populateCategoryDropdown();
    this.toast('Category added');
  }

  async editCategory(id) {
    const cats = this.dataManager.getCategories();
    const cat = cats.find(c => c.id == id);
    if (!cat) return;
    
    document.getElementById('category-name').value = cat.name;
    document.getElementById('category-description').value = cat.description || '';
    document.getElementById('category-image').value = cat.image || '';
    this.currentEditingId = id;
    
    const btn = document.querySelector('#add-category-form button');
    btn.textContent = 'Update category';
    btn.onclick = (e) => this.handleUpdateCategory(e, id);
    
    // Switch to categories tab and scroll to form
    this.switchTab('categories');
    await this.scrollToFormAndFocus('add-category-form', 'category-name');
    
    this.toast('Category loaded for editing - scroll to form');
  }

  async handleUpdateCategory(e, id) {
    e.preventDefault();
    const updated = {
      name: document.getElementById('category-name').value,
      description: document.getElementById('category-description').value,
      image: document.getElementById('category-image').value
    };
    await this.dataManager.updateCategory(id, updated);
    this.resetCategoryForm();
    await this.loadCategoriesList();
    await this.populateCategoryDropdown();
    this.toast('Category updated');
  }

  resetCategoryForm() {
    const f = document.getElementById('add-category-form');
    f?.reset();
    const btn = f?.querySelector('button');
    if (btn) {
      btn.textContent = 'Add category';
      btn.onclick = (e) => this.handleAddCategory(e);
    }
    this.currentEditingId = null;
  }

  async deleteCategory(id) {
    if (confirm('Delete this category?')) {
      await this.dataManager.deleteCategory(id);
      await this.loadCategoriesList();
      await this.populateCategoryDropdown();
      this.toast('Category deleted');
    }
  }

  async populateCategoryDropdown() {
    const dropdown = document.getElementById('product-category');
    if (!dropdown || !this.dataManager) return;
    const cats = this.dataManager.getCategories();
    dropdown.innerHTML = '<option value="">Select a category</option>' +
      cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  // Products
  async loadProductsList() {
    const container = document.getElementById('products-list-container');
    if (!container || !this.dataManager) return;
    const prods = this.dataManager.getProducts();
    const cats = this.dataManager.getCategories();
    if (!Array.isArray(prods) || prods.length === 0) {
      container.innerHTML = '<p>No products yet.</p>';
      return;
    }
    container.innerHTML = prods.map(p => {
      const cat = cats.find(c => c.id == p.categoryId);
      return `
        <div class="product-item">
          <div class="product-info">
            <div class="product-preview">
              <div class="product-image-container">
                <img src="${p.image || 'images/placeholder-image.png'}" alt="${p.name}" class="product-image" onerror="admin.handleAdminImageError(this)">
                <div class="image-placeholder" style="display:none;">No Image</div>
              </div>
              <div class="product-details">
                <h4>${p.name}</h4>
                <p>${p.description || ''}</p>
                <small><strong>Category:</strong> ${cat ? cat.name : 'Unknown'}</small>
                <div class="product-price">${p.price || ''}</div>
              </div>
            </div>
          </div>
          <div class="product-actions">
            <button class="edit-btn" onclick="admin.editProduct('${p.id}')">Edit</button>
            <button class="delete-btn" onclick="admin.deleteProduct('${p.id}')">Delete</button>
          </div>
        </div>`;
    }).join('');
  }

  handleAdminImageError(img) {
    const container = img.parentElement;
    if (container) {
      img.style.display = 'none';
      const placeholder = container.querySelector('.image-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.height = '60px';
        placeholder.style.background = '#f5f5f5';
        placeholder.style.color = '#666';
        placeholder.style.fontFamily = 'Poppins, sans-serif';
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
    await this.dataManager.addProduct(product);
    this.safeFormReset('add-product-form');
    await this.loadProductsList();
    this.toast('Product added');
  }

  async editProduct(id) {
    const prods = this.dataManager.getProducts();
    const p = prods.find(pr => pr.id == id);
    if (!p) return;
    
    document.getElementById('product-category').value = p.categoryId;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-description').value = p.description || '';
    document.getElementById('product-specs').value = p.specs || '';
    document.getElementById('product-price').value = (p.price || '').replace(' EGP','');
    document.getElementById('product-image').value = p.image || '';
    this.currentEditingId = id;
    
    const btn = document.querySelector('#add-product-form button');
    btn.textContent = 'Update product';
    btn.onclick = (e) => this.handleUpdateProduct(e, id);
    
    // Switch to products tab and scroll to form
    this.switchTab('products');
    await this.scrollToFormAndFocus('add-product-form', 'product-name');
    
    this.toast('Product loaded for editing - scroll to form');
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
    await this.dataManager.updateProduct(id, updated);
    this.resetProductForm();
    await this.loadProductsList();
    this.toast('Product updated');
  }

  resetProductForm() {
    const f = document.getElementById('add-product-form');
    f?.reset();
    const btn = f?.querySelector('button');
    if (btn) {
      btn.textContent = 'Add product';
      btn.onclick = (e) => this.handleAddProduct(e);
    }
    this.currentEditingId = null;
  }

  async deleteProduct(id) {
    if (confirm('Delete this product?')) {
      await this.dataManager.deleteProduct(id);
      await this.loadProductsList();
      this.toast('Product deleted');
    }
  }

  // Debug & UI
  debugContentLoading() {
    if (!this.dataManager) return;
    const content = this.dataManager.getContent();
    const keys = ['website-name','about-history-title','hero-title'];
    keys.forEach(k => console.log('content.', k, content[k]));
  }

  toast(msg) {
    const div = document.createElement('div');
    div.className = 'success-message';
    div.textContent = msg;
    div.style.cssText = `background:#4CAF50;color:#fff;padding:12px;margin:10px 0;
      border-radius:5px;text-align:center;font-family:'Poppins',sans-serif;`;
    const container = document.querySelector('.admin-container') || document.body;
    container.insertBefore(div, container.firstChild);
    setTimeout(() => div.remove(), 3000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.admin = new AdminPanel();
});