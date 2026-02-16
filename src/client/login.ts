import type { AuthStatus } from '../shared/types';

const params = new URLSearchParams(window.location.search);

if (params.get('error')) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = 'Invalid username or password.';
  }
}

if (params.get('redirect')) {
  const redirectInput = document.getElementById('redirect-input') as HTMLInputElement;
  if (redirectInput) {
    redirectInput.value = params.get('redirect') || '';
  }
  
  if (params.get('redirect') === 'checkout') {
    const checkoutMessage = document.getElementById('checkout-message');
    if (checkoutMessage) {
      checkoutMessage.style.display = 'block';
    }
  }
}
