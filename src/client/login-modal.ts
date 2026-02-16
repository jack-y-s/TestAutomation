// Shared login modal functionality

export function initLoginModal(): void {
  const loginButton = document.getElementById('login-button');
  const loginModal = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');
  const resetModal = document.getElementById('reset-modal');
  const loginForm = document.getElementById('modal-login-form') as HTMLFormElement;
  const registerForm = document.getElementById('modal-register-form') as HTMLFormElement;
  const resetForm = document.getElementById('modal-reset-form') as HTMLFormElement;
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const resetError = document.getElementById('reset-error');

  // Open login modal
  loginButton?.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginModal) {
      loginModal.style.display = 'flex';
    }
  });

  // Modal switching links
  document.getElementById('show-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAllModals();
    if (registerModal) registerModal.style.display = 'flex';
  });

  document.getElementById('show-reset')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeAllModals();
    if (resetModal) resetModal.style.display = 'flex';
  });

  document.querySelectorAll('.back-to-login').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllModals();
      if (loginModal) loginModal.style.display = 'flex';
    });
  });

  // Close modals when clicking outside
  [loginModal, registerModal, resetModal].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  // Helper function to close all modals
  function closeAllModals(): void {
    [loginModal, registerModal, resetModal].forEach(modal => {
      if (modal) modal.style.display = 'none';
    });
    if (loginError) loginError.style.display = 'none';
    if (registerError) registerError.style.display = 'none';
    if (resetError) resetError.style.display = 'none';
    loginForm?.reset();
    registerForm?.reset();
    resetForm?.reset();
  }

  // Handle login form submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        closeAllModals();
        window.location.reload();
      } else {
        if (loginError) {
          loginError.textContent = data.message || 'Invalid username or password';
          loginError.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (loginError) {
        loginError.textContent = 'An error occurred. Please try again.';
        loginError.style.display = 'block';
      }
    }
  });

  // Handle register form submission
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      if (registerError) {
        registerError.textContent = 'Passwords do not match';
        registerError.style.display = 'block';
      }
      return;
    }

    // Validate password length
    if (password.length < 6) {
      if (registerError) {
        registerError.textContent = 'Password must be at least 6 characters';
        registerError.style.display = 'block';
      }
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (registerError) {
          registerError.textContent = data.message + '. Redirecting to login...';
          registerError.style.display = 'block';
          registerError.style.backgroundColor = '#d4edda';
          registerError.style.color = '#155724';
        }
        setTimeout(() => {
          closeAllModals();
          if (loginModal) loginModal.style.display = 'flex';
        }, 1500);
      } else {
        if (registerError) {
          registerError.textContent = data.message;
          registerError.style.display = 'block';
          registerError.style.backgroundColor = '#f8d7da';
          registerError.style.color = '#dc3545';
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (registerError) {
        registerError.textContent = 'An error occurred. Please try again.';
        registerError.style.display = 'block';
      }
    }
  });

  // Handle reset form submission
  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(resetForm);
    const username = formData.get('username') as string;
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      if (resetError) {
        resetError.textContent = 'Passwords do not match';
        resetError.style.display = 'block';
      }
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      if (resetError) {
        resetError.textContent = 'Password must be at least 6 characters';
        resetError.style.display = 'block';
      }
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        if (resetError) {
          resetError.textContent = data.message + '. Redirecting to login...';
          resetError.style.display = 'block';
          resetError.style.backgroundColor = '#d4edda';
          resetError.style.color = '#155724';
        }
        setTimeout(() => {
          closeAllModals();
          if (loginModal) loginModal.style.display = 'flex';
        }, 1500);
      } else {
        if (resetError) {
          resetError.textContent = data.message;
          resetError.style.display = 'block';
          resetError.style.backgroundColor = '#f8d7da';
          resetError.style.color = '#dc3545';
        }
      }
    } catch (error) {
      console.error('Password reset error:', error);
      if (resetError) {
        resetError.textContent = 'An error occurred. Please try again.';
        resetError.style.display = 'block';
      }
    }
  });
}
