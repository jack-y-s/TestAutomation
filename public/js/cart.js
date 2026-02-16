"use strict";
(() => {
  // src/client/login-modal.ts
  function initLoginModal() {
    const loginButton = document.getElementById("login-button");
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");
    const resetModal = document.getElementById("reset-modal");
    const loginForm = document.getElementById("modal-login-form");
    const registerForm = document.getElementById("modal-register-form");
    const resetForm = document.getElementById("modal-reset-form");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");
    const resetError = document.getElementById("reset-error");
    loginButton?.addEventListener("click", (e) => {
      e.preventDefault();
      if (loginModal) {
        loginModal.style.display = "flex";
      }
    });
    document.getElementById("show-register")?.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllModals();
      if (registerModal) registerModal.style.display = "flex";
    });
    document.getElementById("show-reset")?.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllModals();
      if (resetModal) resetModal.style.display = "flex";
    });
    document.querySelectorAll(".back-to-login").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        closeAllModals();
        if (loginModal) loginModal.style.display = "flex";
      });
    });
    [loginModal, registerModal, resetModal].forEach((modal) => {
      modal?.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeAllModals();
        }
      });
    });
    function closeAllModals() {
      [loginModal, registerModal, resetModal].forEach((modal) => {
        if (modal) modal.style.display = "none";
      });
      if (loginError) loginError.style.display = "none";
      if (registerError) registerError.style.display = "none";
      if (resetError) resetError.style.display = "none";
      loginForm?.reset();
      registerForm?.reset();
      resetForm?.reset();
    }
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const username = formData.get("username");
      const password = formData.get("password");
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
          closeAllModals();
          window.location.reload();
        } else {
          if (loginError) {
            loginError.textContent = data.message || "Invalid username or password";
            loginError.style.display = "block";
          }
        }
      } catch (error) {
        console.error("Login error:", error);
        if (loginError) {
          loginError.textContent = "An error occurred. Please try again.";
          loginError.style.display = "block";
        }
      }
    });
    registerForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const username = formData.get("username");
      const email = formData.get("email");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirm-password");
      if (password !== confirmPassword) {
        if (registerError) {
          registerError.textContent = "Passwords do not match";
          registerError.style.display = "block";
        }
        return;
      }
      if (password.length < 6) {
        if (registerError) {
          registerError.textContent = "Password must be at least 6 characters";
          registerError.style.display = "block";
        }
        return;
      }
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (data.success) {
          if (registerError) {
            registerError.textContent = data.message + ". Redirecting to login...";
            registerError.style.display = "block";
            registerError.style.backgroundColor = "#d4edda";
            registerError.style.color = "#155724";
          }
          setTimeout(() => {
            closeAllModals();
            if (loginModal) loginModal.style.display = "flex";
          }, 1500);
        } else {
          if (registerError) {
            registerError.textContent = data.message;
            registerError.style.display = "block";
            registerError.style.backgroundColor = "#f8d7da";
            registerError.style.color = "#dc3545";
          }
        }
      } catch (error) {
        console.error("Registration error:", error);
        if (registerError) {
          registerError.textContent = "An error occurred. Please try again.";
          registerError.style.display = "block";
        }
      }
    });
    resetForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(resetForm);
      const username = formData.get("username");
      const newPassword = formData.get("new-password");
      const confirmPassword = formData.get("confirm-password");
      if (newPassword !== confirmPassword) {
        if (resetError) {
          resetError.textContent = "Passwords do not match";
          resetError.style.display = "block";
        }
        return;
      }
      if (newPassword.length < 6) {
        if (resetError) {
          resetError.textContent = "Password must be at least 6 characters";
          resetError.style.display = "block";
        }
        return;
      }
      try {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, newPassword })
        });
        const data = await response.json();
        if (data.success) {
          if (resetError) {
            resetError.textContent = data.message + ". Redirecting to login...";
            resetError.style.display = "block";
            resetError.style.backgroundColor = "#d4edda";
            resetError.style.color = "#155724";
          }
          setTimeout(() => {
            closeAllModals();
            if (loginModal) loginModal.style.display = "flex";
          }, 1500);
        } else {
          if (resetError) {
            resetError.textContent = data.message;
            resetError.style.display = "block";
            resetError.style.backgroundColor = "#f8d7da";
            resetError.style.color = "#dc3545";
          }
        }
      } catch (error) {
        console.error("Password reset error:", error);
        if (resetError) {
          resetError.textContent = "An error occurred. Please try again.";
          resetError.style.display = "block";
        }
      }
    });
  }

  // src/client/cart.ts
  var allProducts = [];
  async function loadProducts() {
    try {
      const response = await fetch("/api/products");
      allProducts = await response.json();
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }
  async function loadCart() {
    try {
      await loadProducts();
      const response = await fetch("/api/cart");
      const cart = await response.json();
      const cartItems = document.getElementById("cart-items");
      const cartSummary = document.getElementById("cart-summary");
      const emptyCart = document.getElementById("empty-cart");
      if (!cartItems || !cartSummary || !emptyCart) return;
      if (cart.length === 0) {
        cartItems.style.display = "none";
        cartSummary.style.display = "none";
        emptyCart.style.display = "block";
      } else {
        emptyCart.style.display = "none";
        cartItems.style.display = "block";
        cartSummary.style.display = "block";
        await renderCart(cart);
      }
      updateCartCount(cart);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }
  async function renderCart(cart) {
    const container = document.getElementById("cart-items");
    if (!container) return;
    container.innerHTML = "";
    let subtotal = 0;
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      const product = allProducts.find((p) => p.id === item.productId);
      const availableStock = product?.stock || 0;
      const isStockWarning = item.quantity > availableStock;
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-price"><span style="font-size: 0.7em;">RM</span>${item.price.toFixed(2)} each</div>
        ${isStockWarning ? `<div class="stock-warning">\u26A0\uFE0F Only ${availableStock} item(s) available</div>` : ""}
      </div>
      <div class="item-quantity">
        <label>Quantity:</label>
        <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${availableStock}" data-product-id="${item.productId}" data-available-stock="${availableStock}">
        <span><span style="font-size: 0.7em;">RM</span>${itemTotal.toFixed(2)}</span>
        <button class="remove-btn" data-product-id="${item.productId}">Remove</button>
      </div>
    `;
      const qtyInput = cartItem.querySelector(".qty-input");
      if (qtyInput) {
        qtyInput.addEventListener("change", () => {
          updateQuantity(item.productId, parseInt(qtyInput.value), availableStock);
        });
      }
      const removeBtn = cartItem.querySelector(".remove-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          removeFromCart(item.productId);
        });
      }
      container.appendChild(cartItem);
    });
    const authStatus = await getAuthStatus();
    const isNewUser = authStatus.isNewUser || false;
    const discount = isNewUser ? Math.min(subtotal * 0.1, 100) : 0;
    const afterDiscount = subtotal - discount;
    const shipping = afterDiscount >= 100 ? 0 : 10;
    const taxes = afterDiscount * 0.06;
    const total = afterDiscount + shipping + taxes;
    const subtotalElement = document.getElementById("subtotal");
    const discountElement = document.getElementById("discount");
    const discountRow = document.getElementById("discount-row");
    const shippingElement = document.getElementById("shipping");
    const taxesElement = document.getElementById("taxes");
    const totalElement = document.getElementById("total");
    if (subtotalElement) subtotalElement.innerHTML = `<span style="font-size: 0.7em;">RM</span>${subtotal.toFixed(2)}`;
    if (discountRow && discountElement) {
      if (isNewUser) {
        discountRow.style.display = "flex";
        discountElement.innerHTML = `-<span style="font-size: 0.7em;">RM</span>${discount.toFixed(2)}`;
      } else {
        discountRow.style.display = "none";
      }
    }
    if (shippingElement) shippingElement.innerHTML = shipping === 0 ? '<span style="color: #28a745;">FREE</span>' : `<span style="font-size: 0.7em;">RM</span>${shipping.toFixed(2)}`;
    if (taxesElement) taxesElement.innerHTML = `<span style="font-size: 0.7em;">RM</span>${taxes.toFixed(2)}`;
    if (totalElement) totalElement.innerHTML = `<span style="font-size: 0.7em;">RM</span>${total.toFixed(2)}`;
  }
  async function getAuthStatus() {
    try {
      const response = await fetch("/api/auth-status");
      return await response.json();
    } catch (error) {
      console.error("Error checking auth status:", error);
      return { authenticated: false, username: "", isNewUser: false };
    }
  }
  async function updateQuantity(productId, quantity, availableStock) {
    if (isNaN(quantity) || quantity <= 0) {
      showErrorNotification("Please enter a valid quantity");
      return;
    }
    if (quantity > availableStock) {
      showErrorNotification(`Only ${availableStock} item(s) available in stock`);
      await loadCart();
      return;
    }
    try {
      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });
      if (response.ok) {
        await loadCart();
      } else {
        const error = await response.json();
        showErrorNotification(error.message || "Failed to update quantity");
        await loadCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      showErrorNotification("An error occurred. Please try again.");
      await loadCart();
    }
  }
  async function removeFromCart(productId) {
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }
  function updateCartCount(cart) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
      cartCountElement.textContent = count.toString();
    }
  }
  function goToCheckout() {
    window.location.href = "/checkout";
  }
  async function updateNavigation() {
    try {
      const response = await fetch("/api/auth-status");
      const data = await response.json();
      const loginButton = document.getElementById("login-button");
      const userMenu = document.getElementById("user-menu");
      const usernameBtn = document.getElementById("username-btn");
      if (loginButton && userMenu && usernameBtn) {
        if (data.authenticated && data.username) {
          loginButton.style.display = "none";
          userMenu.style.display = "block";
          usernameBtn.textContent = data.username;
        } else {
          loginButton.style.display = "block";
          userMenu.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  }
  function initDropdown() {
    const usernameBtn = document.getElementById("username-btn");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const feedbackBtn = document.getElementById("feedback-btn");
    usernameBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle("show");
    });
    document.addEventListener("click", () => {
      dropdownMenu?.classList.remove("show");
    });
    feedbackBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      dropdownMenu?.classList.remove("show");
      const feedbackModal = document.getElementById("feedback-modal");
      if (feedbackModal) {
        feedbackModal.style.display = "flex";
      }
    });
  }
  function initFeedbackModal() {
    const feedbackModal = document.getElementById("feedback-modal");
    const feedbackForm = document.getElementById("modal-feedback-form");
    const closeFeedbackLinks = document.querySelectorAll(".close-feedback");
    closeFeedbackLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        feedbackModal.style.display = "none";
        feedbackForm.reset();
      });
    });
    feedbackModal?.addEventListener("click", (e) => {
      if (e.target === feedbackModal) {
        feedbackModal.style.display = "none";
        feedbackForm.reset();
      }
    });
    feedbackForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedbackText = document.getElementById("feedback-text").value;
      const submitBtn = feedbackForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loader"></span>Submitting...';
      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: feedbackText })
        });
        if (response.ok) {
          feedbackModal.style.display = "none";
          feedbackForm.reset();
          showErrorNotification("Thank you for your feedback!");
        } else {
          const error = await response.json();
          showErrorNotification(error.error || "Failed to submit feedback");
        }
      } catch (error) {
        console.error("Error submitting feedback:", error);
        showErrorNotification("An error occurred. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  function showErrorNotification(message) {
    const errorNotification = document.getElementById("error-notification");
    if (!errorNotification) return;
    errorNotification.textContent = message;
    errorNotification.style.display = "block";
    setTimeout(() => {
      errorNotification.style.display = "none";
    }, 3e3);
  }
  var checkoutBtn = document.querySelector(".checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", goToCheckout);
  }
  loadCart();
  updateNavigation();
  initLoginModal();
  initDropdown();
  initFeedbackModal();
})();
//# sourceMappingURL=cart.js.map
