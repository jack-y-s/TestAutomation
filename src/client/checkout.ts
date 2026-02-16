import type { CartItem, AuthStatus, CustomerInfo } from '../shared/types';
import { initLoginModal } from './login-modal';

async function loadOrderSummary(): Promise<void> {
  try {
    const response = await fetch('/api/cart');
    const cart: CartItem[] = await response.json();

    if (cart.length === 0) {
      window.location.href = '/cart';
      return;
    }

    const container = document.getElementById('summary-items');
    if (!container) return;
    
    let subtotal = 0;

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const div = document.createElement('div');
      div.className = 'summary-item';
      div.innerHTML = `
        <span>${item.name} × ${item.quantity}</span>
        <span><span style="font-size: 0.7em;">RM</span>${itemTotal.toFixed(2)}</span>
      `;
      container.appendChild(div);
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
    const subtotalElement = document.getElementById('summary-subtotal');
    const discountElement = document.getElementById('summary-discount');
    const discountRow = document.getElementById('discount-row');
    const shippingElement = document.getElementById('summary-shipping');
    const taxesElement = document.getElementById('summary-taxes');
    const totalElement = document.getElementById('order-total');
    
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
  } catch (error) {
    console.error('Error loading order summary:', error);
  }
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

const checkoutForm = document.getElementById('checkout-form') as HTMLFormElement;
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    // Reset error states
    document.querySelectorAll('.error-message').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    document.querySelectorAll('input').forEach(el => {
      el.classList.remove('error');
    });

    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const addressInput = document.getElementById('address') as HTMLInputElement;
    const cardNumberInput = document.getElementById('cardNumber') as HTMLInputElement;

    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      address: addressInput.value.trim(),
      cardNumber: cardNumberInput.value.trim()
    };

    // Basic validation
    let hasError = false;

    if (!formData.name) {
      const nameError = document.getElementById('name-error');
      if (nameError) nameError.style.display = 'block';
      nameInput.classList.add('error');
      hasError = true;
    }

    if (!formData.email || !formData.email.includes('@')) {
      const emailError = document.getElementById('email-error');
      if (emailError) emailError.style.display = 'block';
      emailInput.classList.add('error');
      hasError = true;
    }

    if (!formData.address) {
      const addressError = document.getElementById('address-error');
      if (addressError) addressError.style.display = 'block';
      addressInput.classList.add('error');
      hasError = true;
    }

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      const cardError = document.getElementById('cardNumber-error');
      if (cardError) cardError.style.display = 'block';
      cardNumberInput.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Disable submit button
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    if (!submitBtn) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        window.location.href = '/order-confirmation';
      } else {
        alert(result.error || 'Checkout failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
  });
}

// Format card number input
const cardNumberInput = document.getElementById('cardNumber') as HTMLInputElement;
if (cardNumberInput) {
  cardNumberInput.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    target.value = formattedValue;
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
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
        alert('Thank you for your feedback!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
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
    console.error('Error loading cart count:', error);
  }
}

// Load order summary on page load
loadOrderSummary();
updateNavigation();
updateCartCount();
initLoginModal();
initDropdown();
initFeedbackModal();
