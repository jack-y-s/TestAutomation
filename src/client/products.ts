import type { Product, CartItem, AuthStatus } from '../shared/types';
import { initLoginModal } from './login-modal';

let allProducts: Product[] = [];
let filteredProducts: Product[] = [];
let currentPage = 1;
let itemsPerPage = 6;

async function loadProducts(): Promise<void> {
  const grid = document.getElementById('products-grid');
  if (grid) {
    grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><span class="loader"></span>Loading products...</div>';
  }
  
  try {
    const response = await fetch('/api/products');
    allProducts = await response.json();
    filteredProducts = [...allProducts];
    currentPage = 1;
    renderProducts();
    renderPagination();
    updateCartCount();
  } catch (error) {
    console.error('Error loading products:', error);
    if (grid) {
      grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;">Error loading products. Please refresh the page.</div>';
    }
  }
}

function renderProducts(): void {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;
  
  grid.innerHTML = '';

  // Show empty state if no filtered products
  if (filteredProducts.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    return;
  }
  
  // Hide empty state if products exist
  if (emptyState) {
    emptyState.style.display = 'none';
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);

  productsToShow.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
        ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
      </div>
      <div class="product-image">${product.image}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-description">${product.description}</div>
      <div class="product-price"><span style="font-size: 0.7em;">RM</span>${product.price.toFixed(2)}</div>
      <div class="product-actions">
        <div class="quantity-selector">
          <select class="quantity-dropdown" id="qty-select-${product.id}">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="custom">Custom</option>
          </select>
          <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" id="qty-${product.id}" style="display: none;">
        </div>
        <button class="add-to-cart-btn" data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
          ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    `;
    
    const addButton = card.querySelector('.add-to-cart-btn');
    if (addButton) {
      addButton.addEventListener('click', () => addToCart(product.id));
    }
    
    // Handle quantity selector dropdown
    const dropdown = card.querySelector(`.quantity-dropdown`) as HTMLSelectElement;
    const customInput = card.querySelector(`#qty-${product.id}`) as HTMLInputElement;
    if (dropdown && customInput) {
      dropdown.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (value === 'custom') {
          customInput.style.display = 'block';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
          customInput.value = value;
        }
      });
      
      customInput.addEventListener('change', () => {
        dropdown.value = 'custom';
      });
    }
    
    grid.appendChild(card);
  });
}

async function addToCart(productId: number): Promise<void> {
  const customInput = document.getElementById(`qty-${productId}`) as HTMLInputElement;
  const dropdown = document.querySelector(`#qty-select-${productId}`) as HTMLSelectElement;
  const addButton = document.querySelector(`[data-product-id="${productId}"]`) as HTMLButtonElement;
  if (!customInput || !dropdown || !addButton) return;
  
  // Show loading state
  const originalText = addButton.textContent;
  addButton.disabled = true;
  addButton.classList.add('btn-loading');
  addButton.innerHTML = '<span class="loader"></span>Adding...';
  
  // Get quantity from custom input if visible, otherwise from dropdown
  let quantity = parseInt(customInput.value);
  if (customInput.style.display === 'none') {
    quantity = parseInt(dropdown.value);
  }
  
  // Validate quantity
  if (isNaN(quantity) || quantity <= 0) {
    showErrorNotification('Please enter a valid quantity');
    addButton.disabled = false;
    addButton.classList.remove('btn-loading');
    addButton.textContent = originalText;
    return;
  }
  
  // Find the product to check available stock
  const product = allProducts.find(p => p.id === productId);
  if (!product) {
    showErrorNotification('Product not found');
    addButton.disabled = false;
    addButton.classList.remove('btn-loading');
    addButton.textContent = originalText;
    return;
  }

  // Check if quantity exceeds available stock
  if (quantity > product.stock) {
    showErrorNotification(`Only ${product.stock} item(s) available in stock`);
    addButton.disabled = false;
    addButton.classList.remove('btn-loading');
    addButton.textContent = originalText;
    return;
  }

  try {
    const cartResponse = await fetch('/api/cart');
    const cart: CartItem[] = await cartResponse.json();
    const existingCartItem = cart.find(item => item.productId === productId);
    const existingQuantity = existingCartItem?.quantity || 0;
    const totalQuantity = quantity + existingQuantity;
    
    // Check if total quantity exceeds available stock
    if (totalQuantity > product.stock) {
      const remaining = product.stock - existingQuantity;
      if (remaining <= 0) {
        showErrorNotification(`You already have all available items of this product in your cart`);
      } else {
        showErrorNotification(`You can only add ${remaining} more item(s). You already have ${existingQuantity} in your cart.`);
      }
      addButton.disabled = false;
      addButton.classList.remove('btn-loading');
      addButton.textContent = originalText;
      return;
    }
  } catch (error) {
    console.error('Error checking cart:', error);
    showErrorNotification('Error verifying cart inventory');
    addButton.disabled = false;
    addButton.classList.remove('btn-loading');
    addButton.textContent = originalText;
    return;
  }
  
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });

    if (response.ok) {
      showNotification();
      updateCartCount();
    } else {
      const error = await response.json();
      showErrorNotification(error.message || 'Failed to add item to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showErrorNotification('An error occurred. Please try again.');
  } finally {
    // Reset button state
    addButton.disabled = false;
    addButton.classList.remove('btn-loading');
    addButton.textContent = originalText;
  }
}

async function updateCartCount(): Promise<void> {
  try {
    const response = await fetch('/api/cart');
    const cart: CartItem[] = await response.json();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = count.toString();
    }
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

function showNotification(): void {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}

function showErrorNotification(message: string): void {
  const errorNotification = document.getElementById('error-notification');
  if (!errorNotification) return;
  
  errorNotification.textContent = message;
  errorNotification.style.display = 'block';
  setTimeout(() => {
    errorNotification.style.display = 'none';
  }, 3000);
}

function filterAndSort(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
  const filterSelect = document.getElementById('filter-select') as HTMLSelectElement;
  
  if (!searchInput || !sortSelect || !filterSelect) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const sortBy = sortSelect.value;
  const filterBy = filterSelect.value;

  // Filter by search term
  filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm)
  );

  // Apply category or price filter
  if (filterBy !== 'all') {
    if (filterBy.startsWith('category-')) {
      const category = filterBy.replace('category-', '');
      filteredProducts = filteredProducts.filter(product => product.category === category);
    } else if (filterBy.startsWith('price-')) {
      const [, minStr, maxStr] = filterBy.split('-');
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      filteredProducts = filteredProducts.filter(product => 
        product.price >= min && product.price <= max
      );
    }
  }

  // Sort
  filteredProducts.sort((a, b) => {
    switch(sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return b.id - a.id; // Higher ID = newer
      case 'default':
      default:
        return a.id - b.id; // Original order
    }
  });

  currentPage = 1; // Reset to first page when filtering/sorting
  renderProducts();
  renderPagination();
}

function renderPagination(): void {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let paginationHTML = '<div class="pagination-controls">';
  
  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}" aria-label="Previous page">&lt;</button>`;
  } else {
    paginationHTML += `<button class="page-btn" disabled aria-label="Previous page">&lt;</button>`;
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="page-btn active" data-page="${i}">${i}</button>`;
    } else {
      paginationHTML += `<button class="page-btn" data-page="${i}">${i}</button>`;
    }
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}" aria-label="Next page">&gt;</button>`;
  } else {
    paginationHTML += `<button class="page-btn" disabled aria-label="Next page">&gt;</button>`;
  }

  paginationHTML += '</div>';
  paginationContainer.innerHTML = paginationHTML;

  // Add event listeners to pagination buttons
  const pageButtons = paginationContainer.querySelectorAll('.page-btn[data-page]');
  pageButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const page = parseInt((e.target as HTMLButtonElement).dataset.page || '1');
      currentPage = page;
      renderProducts();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function updateNavigation(): Promise<void> {
  try {
    const response = await fetch('/api/auth-status');
    const data: AuthStatus = await response.json();
    
    const loginButton = document.getElementById('login-button');
    const userMenu = document.getElementById('user-menu');
    const usernameBtn = document.getElementById('username-btn');
    
    if (loginButton && userMenu && usernameBtn) {
      if (data.authenticated && data.username) {
        loginButton.style.display = 'none';
        userMenu.style.display = 'block';
        usernameBtn.textContent = data.username;
      } else {
        loginButton.style.display = 'block';
        userMenu.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
}

function initDropdown(): void {
  const usernameBtn = document.getElementById('username-btn');
  const dropdownMenu = document.getElementById('dropdown-menu');
  const feedbackBtn = document.getElementById('feedback-btn');
  
  usernameBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdownMenu?.classList.remove('show');
  });
  
  // Feedback button handler
  feedbackBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownMenu?.classList.remove('show');
    const feedbackModal = document.getElementById('feedback-modal') as HTMLDivElement;
    if (feedbackModal) {
      feedbackModal.style.display = 'flex';
    }
  });
}

function initFeedbackModal(): void {
  const feedbackModal = document.getElementById('feedback-modal') as HTMLDivElement;
  const feedbackForm = document.getElementById('modal-feedback-form') as HTMLFormElement;
  const closeFeedbackLinks = document.querySelectorAll('.close-feedback');
  
  // Close modal on close links
  closeFeedbackLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      feedbackModal.style.display = 'none';
      feedbackForm.reset();
    });
  });
  
  // Close modal when clicking outside
  feedbackModal?.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
      feedbackModal.style.display = 'none';
      feedbackForm.reset();
    }
  });
  
  // Handle feedback form submission
  feedbackForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const feedbackText = (document.getElementById('feedback-text') as HTMLTextAreaElement).value;
    const submitBtn = feedbackForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span>Submitting...';
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText })
      });
      
      if (response.ok) {
        showNotification();
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
        
        // Change notification text temporarily
        const notification = document.getElementById('notification');
        if (notification) {
          const originalMsg = notification.textContent;
          notification.textContent = 'Thank you for your feedback!';
          notification.style.display = 'block';
          setTimeout(() => {
            notification.textContent = originalMsg;
            notification.style.display = 'none';
          }, 3000);
        }
      } else {
        const error = await response.json();
        showErrorNotification(error.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showErrorNotification('An error occurred. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Initialize
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterSelect = document.getElementById('filter-select');
const itemsPerPageSelect = document.getElementById('items-per-page') as HTMLSelectElement;

if (searchInput) {
  searchInput.addEventListener('input', filterAndSort);
}

if (sortSelect) {
  sortSelect.addEventListener('change', filterAndSort);
}

if (filterSelect) {
  filterSelect.addEventListener('change', filterAndSort);
}

if (itemsPerPageSelect) {
  itemsPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt((e.target as HTMLSelectElement).value);
    currentPage = 1; // Reset to first page
    renderProducts();
    renderPagination();
  });
}

loadProducts();
updateNavigation();
initLoginModal();
initDropdown();
initFeedbackModal();
