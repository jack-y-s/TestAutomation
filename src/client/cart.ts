import type { CartItem, AuthStatus, Product } from '../shared/types';
import { initLoginModal } from './login-modal';

let allProducts: Product[] = [];

// Fetch products data for stock validation
async function loadProducts(): Promise<void> {
  try {
    const response = await fetch('/api/products');
    allProducts = await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function loadCart(): Promise<void> {
  try {
    // Load products first for stock validation
    await loadProducts();
    
    const response = await fetch('/api/cart');
    const cart: CartItem[] = await response.json();
    
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartItems || !cartSummary || !emptyCart) return;
    
    if (cart.length === 0) {
      cartItems.style.display = 'none';
      cartSummary.style.display = 'none';
      emptyCart.style.display = 'block';
    } else {
      emptyCart.style.display = 'none';
      cartItems.style.display = 'block';
      cartSummary.style.display = 'block';
      await renderCart(cart);
    }
    
    updateCartCount(cart);
  } catch (error) {
    console.error('Error loading cart:', error);
  }
}

async function renderCart(cart: CartItem[]): Promise<void> {
  const container = document.getElementById('cart-items');
  if (!container) return;
  
  container.innerHTML = '';
  
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    // Find product in allProducts to check stock
    const product = allProducts.find(p => p.id === item.productId);
    const availableStock = product?.stock || 0;
    const isStockWarning = item.quantity > availableStock;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-price"><span style="font-size: 0.7em;">RM</span>${item.price.toFixed(2)} each</div>
        ${isStockWarning ? `<div class="stock-warning">⚠️ Only ${availableStock} item(s) available</div>` : ''}
      </div>
      <div class="item-quantity">
        <label>Quantity:</label>
        <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${availableStock}" data-product-id="${item.productId}" data-available-stock="${availableStock}">
        <span><span style="font-size: 0.7em;">RM</span>${itemTotal.toFixed(2)}</span>
        <button class="remove-btn" data-product-id="${item.productId}">Remove</button>
      </div>
    `;
    
    const qtyInput = cartItem.querySelector('.qty-input') as HTMLInputElement;
    if (qtyInput) {
      qtyInput.addEventListener('change', () => {
        updateQuantity(item.productId, parseInt(qtyInput.value), availableStock);
      });
    }
    
    const removeBtn = cartItem.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        removeFromCart(item.productId);
      });
    }
    
    container.appendChild(cartItem);
  });

  // Calculate pricing with taxes, shipping, and discount
  const authStatus: AuthStatus = await getAuthStatus();
  const isNewUser = authStatus.isNewUser || false;
  
  // Apply 10% discount for new users (max RM100)
  const discount = isNewUser ? Math.min(subtotal * 0.10, 100) : 0;
  const afterDiscount = subtotal - discount;
  
  // Free shipping over RM 100, otherwise RM 10
  const shipping = afterDiscount >= 100 ? 0 : 10;
  
  // Calculate 6% tax on subtotal after discount
  const taxes = afterDiscount * 0.06;
  
  // Final total
  const total = afterDiscount + shipping + taxes;
  
  // Update UI
  const subtotalElement = document.getElementById('subtotal');
  const discountElement = document.getElementById('discount');
  const discountRow = document.getElementById('discount-row');
  const shippingElement = document.getElementById('shipping');
  const taxesElement = document.getElementById('taxes');
  const totalElement = document.getElementById('total');
  
  if (subtotalElement) subtotalElement.innerHTML = `<span style="font-size: 0.7em;">RM</span>${subtotal.toFixed(2)}`;
  
  if (discountRow && discountElement) {
    if (isNewUser) {
      discountRow.style.display = 'flex';
      discountElement.innerHTML = `-<span style="font-size: 0.7em;">RM</span>${discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  
  if (shippingElement) shippingElement.innerHTML = shipping === 0 ? '<span style="color: #28a745;">FREE</span>' : `<span style="font-size: 0.7em;">RM</span>${shipping.toFixed(2)}`;
  if (taxesElement) taxesElement.innerHTML = `<span style="font-size: 0.7em;">RM</span>${taxes.toFixed(2)}`;
  if (totalElement) totalElement.innerHTML = `<span style="font-size: 0.7em;">RM</span>${total.toFixed(2)}`;
}

async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const response = await fetch('/api/auth-status');
    return await response.json();
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false, username: '', isNewUser: false };
  }
}

async function updateQuantity(productId: number, quantity: number, availableStock: number): Promise<void> {
  // Validate quantity
  if (isNaN(quantity) || quantity <= 0) {
    showErrorNotification('Please enter a valid quantity');
    return;
  }
  
  // Check if quantity exceeds available stock
  if (quantity > availableStock) {
    showErrorNotification(`Only ${availableStock} item(s) available in stock`);
    await loadCart(); // Reload cart to reset input
    return;
  }
  
  try {
    const response = await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });

    if (response.ok) {
      await loadCart();
    } else {
      const error = await response.json();
      showErrorNotification(error.message || 'Failed to update quantity');
      await loadCart(); // Reload cart on error
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    showErrorNotification('An error occurred. Please try again.');
    await loadCart();
  }
}

async function removeFromCart(productId: number): Promise<void> {
  try {
    const response = await fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      await loadCart();
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
}

function updateCartCount(cart: CartItem[]): void {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = count.toString();
  }
}

function goToCheckout(): void {
  window.location.href = '/checkout';
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
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
        showErrorNotification('Thank you for your feedback!');
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

function showErrorNotification(message: string): void {
  const errorNotification = document.getElementById('error-notification');
  if (!errorNotification) return;
  
  errorNotification.textContent = message;
  errorNotification.style.display = 'block';
  setTimeout(() => {
    errorNotification.style.display = 'none';
  }, 3000);
}

// Initialize checkout button
const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', goToCheckout);
}

// Load cart on page load
loadCart();
updateNavigation();
initLoginModal();
initDropdown();
initFeedbackModal();
