import type { AuthStatus, CartItem } from '../shared/types';
import { initLoginModal } from './login-modal';

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
    console.error('Error loading cart:', error);
  }
}

updateNavigation();
updateCartCount();
initLoginModal();
initDropdown();
initFeedbackModal();
