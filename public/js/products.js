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

  // src/client/products.ts
  var allProducts = [];
  var filteredProducts = [];
  var currentPage = 1;
  var itemsPerPage = 6;
  async function loadProducts() {
    const grid = document.getElementById("products-grid");
    if (grid) {
      grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><span class="loader"></span>Loading products...</div>';
    }
    try {
      const response = await fetch("/api/products");
      allProducts = await response.json();
      filteredProducts = [...allProducts];
      currentPage = 1;
      renderProducts();
      renderPagination();
      updateCartCount();
    } catch (error) {
      console.error("Error loading products:", error);
      if (grid) {
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545;">Error loading products. Please refresh the page.</div>';
      }
    }
  }
  function renderProducts() {
    const grid = document.getElementById("products-grid");
    const emptyState = document.getElementById("empty-state");
    if (!grid) return;
    grid.innerHTML = "";
    if (filteredProducts.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
      }
      return;
    }
    if (emptyState) {
      emptyState.style.display = "none";
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    productsToShow.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
      <div class="product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}">
        ${product.stock > 0 ? "In Stock" : "Out of Stock"}
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
        <button class="add-to-cart-btn" data-product-id="${product.id}" ${product.stock === 0 ? "disabled" : ""}>
          ${product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    `;
      const addButton = card.querySelector(".add-to-cart-btn");
      if (addButton) {
        addButton.addEventListener("click", () => addToCart(product.id));
      }
      const dropdown = card.querySelector(`.quantity-dropdown`);
      const customInput = card.querySelector(`#qty-${product.id}`);
      if (dropdown && customInput) {
        dropdown.addEventListener("change", (e) => {
          const value = e.target.value;
          if (value === "custom") {
            customInput.style.display = "block";
            customInput.focus();
          } else {
            customInput.style.display = "none";
            customInput.value = value;
          }
        });
        customInput.addEventListener("change", () => {
          dropdown.value = "custom";
        });
      }
      grid.appendChild(card);
    });
  }
  async function addToCart(productId) {
    const customInput = document.getElementById(`qty-${productId}`);
    const dropdown = document.querySelector(`#qty-select-${productId}`);
    const addButton = document.querySelector(`[data-product-id="${productId}"]`);
    if (!customInput || !dropdown || !addButton) return;
    const originalText = addButton.textContent;
    addButton.disabled = true;
    addButton.classList.add("btn-loading");
    addButton.innerHTML = '<span class="loader"></span>Adding...';
    let quantity = parseInt(customInput.value);
    if (customInput.style.display === "none") {
      quantity = parseInt(dropdown.value);
    }
    if (isNaN(quantity) || quantity <= 0) {
      showErrorNotification("Please enter a valid quantity");
      addButton.disabled = false;
      addButton.classList.remove("btn-loading");
      addButton.textContent = originalText;
      return;
    }
    const product = allProducts.find((p) => p.id === productId);
    if (!product) {
      showErrorNotification("Product not found");
      addButton.disabled = false;
      addButton.classList.remove("btn-loading");
      addButton.textContent = originalText;
      return;
    }
    if (quantity > product.stock) {
      showErrorNotification(`Only ${product.stock} item(s) available in stock`);
      addButton.disabled = false;
      addButton.classList.remove("btn-loading");
      addButton.textContent = originalText;
      return;
    }
    try {
      const cartResponse = await fetch("/api/cart");
      const cart = await cartResponse.json();
      const existingCartItem = cart.find((item) => item.productId === productId);
      const existingQuantity = existingCartItem?.quantity || 0;
      const totalQuantity = quantity + existingQuantity;
      if (totalQuantity > product.stock) {
        const remaining = product.stock - existingQuantity;
        if (remaining <= 0) {
          showErrorNotification(`You already have all available items of this product in your cart`);
        } else {
          showErrorNotification(`You can only add ${remaining} more item(s). You already have ${existingQuantity} in your cart.`);
        }
        addButton.disabled = false;
        addButton.classList.remove("btn-loading");
        addButton.textContent = originalText;
        return;
      }
    } catch (error) {
      console.error("Error checking cart:", error);
      showErrorNotification("Error verifying cart inventory");
      addButton.disabled = false;
      addButton.classList.remove("btn-loading");
      addButton.textContent = originalText;
      return;
    }
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });
      if (response.ok) {
        showNotification();
        updateCartCount();
      } else {
        const error = await response.json();
        showErrorNotification(error.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showErrorNotification("An error occurred. Please try again.");
    } finally {
      addButton.disabled = false;
      addButton.classList.remove("btn-loading");
      addButton.textContent = originalText;
    }
  }
  async function updateCartCount() {
    try {
      const response = await fetch("/api/cart");
      const cart = await response.json();
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      const cartCountElement = document.getElementById("cart-count");
      if (cartCountElement) {
        cartCountElement.textContent = count.toString();
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }
  function showNotification() {
    const notification = document.getElementById("notification");
    if (!notification) return;
    notification.style.display = "block";
    setTimeout(() => {
      notification.style.display = "none";
    }, 2e3);
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
  function filterAndSort() {
    const searchInput2 = document.getElementById("search-input");
    const sortSelect2 = document.getElementById("sort-select");
    const filterSelect2 = document.getElementById("filter-select");
    if (!searchInput2 || !sortSelect2 || !filterSelect2) return;
    const searchTerm = searchInput2.value.toLowerCase();
    const sortBy = sortSelect2.value;
    const filterBy = filterSelect2.value;
    filteredProducts = allProducts.filter(
      (product) => product.name.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm)
    );
    if (filterBy !== "all") {
      if (filterBy.startsWith("category-")) {
        const category = filterBy.replace("category-", "");
        filteredProducts = filteredProducts.filter((product) => product.category === category);
      } else if (filterBy.startsWith("price-")) {
        const [, minStr, maxStr] = filterBy.split("-");
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        filteredProducts = filteredProducts.filter(
          (product) => product.price >= min && product.price <= max
        );
      }
    }
    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return b.id - a.id;
        // Higher ID = newer
        case "default":
        default:
          return a.id - b.id;
      }
    });
    currentPage = 1;
    renderProducts();
    renderPagination();
  }
  function renderPagination() {
    const paginationContainer = document.getElementById("pagination");
    if (!paginationContainer) return;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }
    let paginationHTML = '<div class="pagination-controls">';
    if (currentPage > 1) {
      paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}" aria-label="Previous page">&lt;</button>`;
    } else {
      paginationHTML += `<button class="page-btn" disabled aria-label="Previous page">&lt;</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        paginationHTML += `<button class="page-btn active" data-page="${i}">${i}</button>`;
      } else {
        paginationHTML += `<button class="page-btn" data-page="${i}">${i}</button>`;
      }
    }
    if (currentPage < totalPages) {
      paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}" aria-label="Next page">&gt;</button>`;
    } else {
      paginationHTML += `<button class="page-btn" disabled aria-label="Next page">&gt;</button>`;
    }
    paginationHTML += "</div>";
    paginationContainer.innerHTML = paginationHTML;
    const pageButtons = paginationContainer.querySelectorAll(".page-btn[data-page]");
    pageButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const page = parseInt(e.target.dataset.page || "1");
        currentPage = page;
        renderProducts();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
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
          showNotification();
          feedbackModal.style.display = "none";
          feedbackForm.reset();
          const notification = document.getElementById("notification");
          if (notification) {
            const originalMsg = notification.textContent;
            notification.textContent = "Thank you for your feedback!";
            notification.style.display = "block";
            setTimeout(() => {
              notification.textContent = originalMsg;
              notification.style.display = "none";
            }, 3e3);
          }
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
  var searchInput = document.getElementById("search-input");
  var sortSelect = document.getElementById("sort-select");
  var filterSelect = document.getElementById("filter-select");
  var itemsPerPageSelect = document.getElementById("items-per-page");
  if (searchInput) {
    searchInput.addEventListener("input", filterAndSort);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", filterAndSort);
  }
  if (filterSelect) {
    filterSelect.addEventListener("change", filterAndSort);
  }
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value);
      currentPage = 1;
      renderProducts();
      renderPagination();
    });
  }
  loadProducts();
  updateNavigation();
  initLoginModal();
  initDropdown();
  initFeedbackModal();
})();
//# sourceMappingURL=products.js.map
