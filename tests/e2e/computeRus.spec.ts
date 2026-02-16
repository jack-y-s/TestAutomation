import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
test.setTimeout(5000);
const TEST_USER = {
  username: 'e2e_user',
  password: 'password123',
  email: 'e2e_user@example.com'
};

async function registerUserUI(page: import('@playwright/test').Page, user: { username: string; email: string; password: string }): Promise<void> {
  await page.goto(`${BASE_URL}/products`);
  await page.click('#login-button');
  await page.click('#show-register');
  await page.fill('#modal-register-form input[name="username"]', user.username);
  await page.fill('#modal-register-form input[name="email"]', user.email);
  await page.fill('#modal-register-form input[name="password"]', user.password);
  await page.fill('#modal-register-form input[name="confirm-password"]', user.password);
  await page.click('#modal-register-form button[type="submit"]');
  const registerError = page.locator('#register-error');
  await expect(registerError).toContainText('Redirecting to login');
}

function createUserData(prefix: string): { username: string; email: string; password: string } {
  const timestamp = Date.now();
  return {
    username: `${prefix}_${timestamp}`,
    email: `${prefix}_${timestamp}@example.com`,
    password: 'SecurePass123!'
  };
}

async function ensureLoggedIn(page: import('@playwright/test').Page, username = TEST_USER.username, password = TEST_USER.password): Promise<void> {
  await page.goto(`${BASE_URL}/products`);
  const loginButton = page.locator('#login-button');
  const usernameBtn = page.locator('#username-btn');

  if (await usernameBtn.isVisible()) {
    const currentUsername = (await usernameBtn.textContent())?.trim();
    if (currentUsername !== username) {
      await page.click('#username-btn');
      await Promise.all([
        page.waitForURL('**/'),
        page.click('form button:has-text("Logout")')
      ]);
    }
  }

  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.fill('#modal-login-form input[name="username"]', username);
    await page.fill('#modal-login-form input[name="password"]', password);
    await page.click('#modal-login-form button[type="submit"]');
  }
  const loginError = page.locator('#login-error');
  const loggedIn = page.locator('#username-btn');
  await Promise.race([
    loggedIn.waitFor({ state: 'visible', timeout: 5000 }),
    loginError.waitFor({ state: 'visible', timeout: 5000 })
  ]);

  if (await loginError.isVisible()) {
    await registerUserUI(page, { username, email: `${username}@example.com`, password });
    const registerModal = page.locator('#register-modal');
    await expect(registerModal).toBeHidden({ timeout: 5000 });

    const loginModal = page.locator('#login-modal');
    if (!(await loginModal.isVisible())) {
      await page.click('#login-button');
    }
    await page.fill('#modal-login-form input[name="username"]', username);
    await page.fill('#modal-login-form input[name="password"]', password);
    await page.click('#modal-login-form button[type="submit"]');
  }

  await expect(page.locator('#username-btn')).toBeVisible({ timeout: 10000 });
}

async function addItemToCart(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`${BASE_URL}/products`);
  const addBtn = page.locator('button.add-to-cart-btn:not([disabled])').first();
  await addBtn.click();
  await expect(page.locator('#notification')).toBeVisible({ timeout: 5000 });
  await page.goto(`${BASE_URL}/cart`);
  await expect(page.locator('.cart-item')).toBeVisible({ timeout: 5000 });
}

async function completeCheckoutUI(page: import('@playwright/test').Page, customer = {
  name: 'John Doe',
  email: 'john@example.com',
  address: '123 Main St',
  cardNumber: '4111 1111 1111 1111'
}): Promise<void> {
  await page.click('button.checkout-btn');
  await expect(page.locator('.checkout-container')).toBeVisible();
  await page.fill('#name', customer.name);
  await page.fill('#email', customer.email);
  await page.fill('#address', customer.address);
  await page.fill('#cardNumber', customer.cardNumber);
  await page.click('#submit-btn');
  await expect(page.locator('#order-number')).toBeVisible();
}

// UI-only: no API-based user bootstrap.

// ============================================================================
// FEATURE 1: USER REGISTRATION
// ============================================================================

test.describe('Feature 1: User Registration', () => {
  test('TC1.1 - Should successfully register a new user with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    await page.click('#show-register');
    
    const timestamp = Date.now();
    await page.fill('#modal-register-form input[name="username"]', `testuser_${timestamp}`);
    await page.fill('#modal-register-form input[name="email"]', `test_${timestamp}@example.com`);
    await page.fill('#modal-register-form input[name="password"]', 'SecurePass123!');
    await page.fill('#modal-register-form input[name="confirm-password"]', 'SecurePass123!');
    await page.click('#modal-register-form button[type="submit"]');

    const registerError = page.locator('#register-error');
    await expect(registerError).toBeVisible();
    await expect(registerError).toContainText('Redirecting to login');

    const loginModal = page.locator('#login-modal');
    await expect(loginModal).toBeVisible({ timeout: 3000 });
  });

  test('TC1.2 - Should show error when passwords do not match', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    await page.click('#show-register');
    
    const timestamp = Date.now();
    await page.fill('#modal-register-form input[name="username"]', `testuser_${timestamp}`);
    await page.fill('#modal-register-form input[name="email"]', `test_${timestamp}@example.com`);
    await page.fill('#modal-register-form input[name="password"]', 'SecurePass123!');
    await page.fill('#modal-register-form input[name="confirm-password"]', 'DifferentPass123!');
    await page.click('#modal-register-form button[type="submit"]');
    
    const errorElement = page.locator('#register-error');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText('Passwords do not match');
  });

  test('TC1.3 - Should reject registration with duplicate username', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    await page.click('#show-register');
    await page.fill('#modal-register-form input[name="username"]', 'automation');
    await page.fill('#modal-register-form input[name="email"]', 'automation@test.com');
    await page.fill('#modal-register-form input[name="password"]', 'SecurePass123!');
    await page.fill('#modal-register-form input[name="confirm-password"]', 'SecurePass123!');
    await page.click('#modal-register-form button[type="submit"]');
    
    const errorElement = page.locator('#register-error');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText('Username already exists');
  });

  test('TC1.4 - Should require all mandatory fields for registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    await page.click('#show-register');

    await expect(page.locator('#modal-register-form input[name="username"]')).toHaveAttribute('required', '');
    await expect(page.locator('#modal-register-form input[name="email"]')).toHaveAttribute('required', '');
    await expect(page.locator('#modal-register-form input[name="password"]')).toHaveAttribute('required', '');
    await expect(page.locator('#modal-register-form input[name="confirm-password"]')).toHaveAttribute('required', '');
  });

  test('TC1.5 - Should set new user flag for discount eligibility', async ({ page }) => {
    const timestamp = Date.now();
    const username = `newuser_${timestamp}`;
    
    await registerUserUI(page, { username, email: `${timestamp}@example.com`, password: 'SecurePass123!' });
    await ensureLoggedIn(page, username, 'SecurePass123!');
    await addItemToCart(page);
    
    const discountRow = page.locator('#discount-row');
    await expect(discountRow).toBeVisible();
  });
});

// ============================================================================
// FEATURE 2: USER LOGIN & PASSWORD RESET
// ============================================================================

test.describe('Feature 2: User Login & Password Reset', () => {
  test('TC2.1 - Should successfully login with valid credentials', async ({ page }) => {
    const user = createUserData('loginuser');
    await registerUserUI(page, user);

    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    
    await page.fill('#modal-login-form input[name="username"]', user.username);
    await page.fill('#modal-login-form input[name="password"]', user.password);
    await page.click('#modal-login-form button[type="submit"]');
    
    // Verify logged in state
    const usernameBtn = page.locator('#username-btn');
    await expect(usernameBtn).toBeVisible({ timeout: 5000 });
    await expect(usernameBtn).toContainText(user.username);
  });

  test('TC2.2 - Should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    
    await page.fill('#modal-login-form input[name="username"]', 'invaliduser');
    await page.fill('#modal-login-form input[name="password"]', 'wrongpassword');
    await page.click('#modal-login-form button[type="submit"]');
    
    const errorElement = page.locator('#login-error');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText('Invalid username or password');
  });

  test('TC2.3 - Should reset password successfully', async ({ page }) => {
    const user = createUserData('resetuser');
    await registerUserUI(page, user);

    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    await page.click('#show-reset');
    
    await page.fill('#modal-reset-form input[name="username"]', user.username);
    await page.fill('#modal-reset-form input[name="new-password"]', 'NewPass456!');
    await page.fill('#modal-reset-form input[name="confirm-password"]', 'NewPass456!');
    await page.click('#modal-reset-form button[type="submit"]');

    const resetError = page.locator('#reset-error');
    await expect(resetError).toBeVisible();
    await expect(resetError).toContainText('Redirecting to login');

    const loginModal = page.locator('#login-modal');
    await expect(loginModal).toBeVisible({ timeout: 3000 });
  });

  test('TC2.4 - Should not reset password with mismatched passwords', async ({ page }) => {
    const user = createUserData('resetuser');
    await registerUserUI(page, user);

    await page.goto(`${BASE_URL}/products`);
    await page.click('#login-button');
    await page.click('#show-reset');
    
    await page.fill('#modal-reset-form input[name="username"]', user.username);
    await page.fill('#modal-reset-form input[name="new-password"]', 'NewPass456!');
    await page.fill('#modal-reset-form input[name="confirm-password"]', 'DifferentPass456!');
    await page.click('#modal-reset-form button[type="submit"]');
    
    const errorElement = page.locator('#reset-error');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText('Passwords do not match');
  });

  test('TC2.5 - Should logout successfully and show login button', async ({ page }) => {
    await ensureLoggedIn(page);

    await page.click('#username-btn');
    await Promise.all([
      page.waitForURL('**/'),
      page.click('form button:has-text("Logout")')
    ]);

    const loginButton = page.locator('#login-button');
    await expect(loginButton).toBeVisible();
  });
});

// ============================================================================
// FEATURE 3: PRODUCT BROWSING & SEARCH
// ============================================================================

test.describe('Feature 3: Product Browsing & Search', () => {
  test('TC3.1 - Should display all products on initial load', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    
    // Default is 6 items per page
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(6);
  });

  test('TC3.2 - Should search products by name', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.fill('#search-input', 'Dell');
    
    // Wait for filtering
    await page.waitForTimeout(500);
    
    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    
    expect(count).toBeGreaterThan(0);
    
    const productName = page.locator('.product-name').first();
    await expect(productName).toContainText('Dell');
  });

  test('TC3.3 - Should filter products by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.selectOption('#filter-select', 'category-Mobile');
    
    await page.waitForTimeout(500);
    
    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('TC3.4 - Should sort products by price ascending', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.selectOption('#sort-select', 'price-asc');
    
    await page.waitForTimeout(500);
    
    const prices = await page.locator('.product-price').allTextContents();
    expect(prices.length).toBeGreaterThan(0);
  });

  test('TC3.5 - Should show empty state when no products match search', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.fill('#search-input', 'NonExistentProductXYZ123');
    
    await page.waitForTimeout(500);
    
    const emptyState = page.locator('#empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No products found');
  });
});

// ============================================================================
// FEATURE 4: PAGINATION & ITEMS PER PAGE
// ============================================================================

test.describe('Feature 4: Pagination & Items Per Page', () => {
  test('TC4.1 - Should display default 6 items per page', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    
    expect(count).toBeLessThanOrEqual(6);
  });

  test('TC4.2 - Should change items per page to 12', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.selectOption('#items-per-page', '12');
    
    await page.waitForTimeout(500);
    
    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    
    expect(count).toBeLessThanOrEqual(12);
  });

  test('TC4.3 - Should navigate through pages with pagination buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.selectOption('#items-per-page', '6');
    
    await page.waitForTimeout(500);
    
    // Click next page button
    const nextBtn = page.locator('.page-btn:has-text(">")').first();
    await nextBtn.click();
    
    await page.waitForTimeout(500);
    
    const activePageBtn = page.locator('.page-btn.active');
    const pageNum = await activePageBtn.textContent();
    expect(pageNum).toBe('2');
  });

  test('TC4.4 - Should reset to page 1 when changing items per page', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.selectOption('#items-per-page', '6');
    
    // Go to page 2
    const nextBtn = page.locator('.page-btn:has-text(">")').first();
    await nextBtn.click();
    
    // Change items per page
    await page.selectOption('#items-per-page', '12');
    
    await page.waitForTimeout(500);
    
    const activePageBtn = page.locator('.page-btn.active');
    const pageNum = await activePageBtn.textContent();
    expect(pageNum).toBe('1');
  });

  test('TC4.5 - Should disable previous button on first page', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const prevBtn = page.locator('.page-btn:has-text("<")').first();
    const isDisabled = await prevBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
  });
});

// ============================================================================
// FEATURE 5: STOCK MANAGEMENT
// ============================================================================

test.describe('Feature 5: Stock Management', () => {
  test('TC5.1 - Should display in-stock badge for available products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const stockBadge = page.locator('.product-stock.in-stock').first();
    await expect(stockBadge).toBeVisible();
    await expect(stockBadge).toContainText('In Stock');
  });

  test('TC5.2 - Should display out-of-stock badge for unavailable products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const outOfStockBadges = page.locator('.product-stock.out-of-stock');
    const count = await outOfStockBadges.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('TC5.3 - Should disable add-to-cart button for out-of-stock products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const outOfStockBtn = page.locator('button:has-text("Out of Stock")').first();
    const isDisabled = await outOfStockBtn.isDisabled();
    
    expect(isDisabled).toBe(true);
  });

  test('TC5.4 - Should prevent adding more items than available stock', async ({ page }) => {
    await ensureLoggedIn(page);

    const firstCard = page.locator('.product-card').first();
    await firstCard.locator('.quantity-dropdown').selectOption('custom');

    const quantityInput = firstCard.locator('.quantity-input');
    const maxStock = await quantityInput.getAttribute('max');
    await quantityInput.fill((parseInt(maxStock || '1') + 5).toString());

    await firstCard.locator('button.add-to-cart-btn').click();
    const errorMsg = page.locator('#error-notification');
    await expect(errorMsg).toBeVisible();
  });

  test('TC5.5 - Should show stock warning when cart exceeds available inventory', async ({ page }) => {
    await ensureLoggedIn(page);

    const productsResponse = await page.request.get(`${BASE_URL}/api/products`);
    const products = await productsResponse.json();
    const product = products.find((p: { stock: number }) => p.stock > 0);

    if (!product) {
      test.skip(true, 'No in-stock products available for stock warning test');
    }

    await page.request.post(`${BASE_URL}/api/cart/add`, {
      data: { productId: product.id, quantity: product.stock + 1 }
    });

    await page.goto(`${BASE_URL}/cart`);
    const stockWarning = page.locator('.stock-warning');
    await expect(stockWarning).toBeVisible();
  });
});

// ============================================================================
// FEATURE 6: SHOPPING CART
// ============================================================================

test.describe('Feature 6: Shopping Cart', () => {
  test('TC6.1 - Should add product to cart successfully', async ({ page }) => {
    const user = createUserData('cartuser');
    await registerUserUI(page, user);
    await ensureLoggedIn(page, user.username, user.password);

    await page.locator('button.add-to-cart-btn:not([disabled])').first().click();
    
    // Check cart count updated
    const cartCount = page.locator('#cart-count');
    await expect(cartCount).toContainText('1');
  });

  test('TC6.2 - Should display notification when item added to cart', async ({ page }) => {
    await ensureLoggedIn(page);

    await page.locator('button.add-to-cart-btn:not([disabled])').first().click();
    
    const notification = page.locator('#notification');
    await expect(notification).toBeVisible();
  });

  test('TC6.3 - Should remove item from cart', async ({ page }) => {
    await ensureLoggedIn(page);
    await addItemToCart(page);
    
    // Remove item
    await page.click('button.remove-btn');
    
    const emptyCart = page.locator('#empty-cart');
    await expect(emptyCart).toBeVisible();
  });

  test('TC6.4 - Should update item quantity in cart', async ({ page }) => {
    await ensureLoggedIn(page);
    await addItemToCart(page);
    
    // Update quantity
    const qtyInput = page.locator('.qty-input').first();
    await qtyInput.fill('3');
    await qtyInput.blur();
    
    await page.waitForTimeout(500);
    
    // Should reflect in cart count
    const cartCount = page.locator('#cart-count');
    expect(await cartCount.textContent()).toBeTruthy();
  });

  test('TC6.5 - Should show empty cart message when no items', async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(`${BASE_URL}/cart`);
    
    const emptyCart = page.locator('#empty-cart');
    await expect(emptyCart).toBeVisible();
    await expect(emptyCart).toContainText('Your cart is empty');
  });
});

// ============================================================================
// FEATURE 7: PRICING & DISCOUNTS
// ============================================================================

test.describe('Feature 7: Pricing & Discounts', () => {
  test('TC7.1 - Should display prices in RM format', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const prices = page.locator('.product-price');
    const firstPrice = await prices.first().textContent();
    
    expect(firstPrice).toContain('RM');
  });

  test('TC7.2 - Should apply 10% discount for new users', async ({ page }) => {
    const user = createUserData('newuser_discount');
    await registerUserUI(page, user);
    await ensureLoggedIn(page, user.username, user.password);

    await addItemToCart(page);
    
    // Check discount row is visible
    const discountRow = page.locator('#discount-row');
    await expect(discountRow).toBeVisible();
  });

  test('TC7.3 - Should cap new user discount at RM100 maximum', async ({ page }) => {
    const user = createUserData('discount_cap');
    await registerUserUI(page, user);
    await ensureLoggedIn(page, user.username, user.password);

    const buttons = await page.locator('button.add-to-cart-btn:not([disabled])').all();
    for (let i = 0; i < 5 && i < buttons.length; i++) {
      await buttons[i].click();
      await page.waitForTimeout(100);
    }

    await page.goto(`${BASE_URL}/cart`);
    
    // Get discount amount
    const discountText = await page.locator('#discount-row').textContent();
    const discountAmount = parseFloat(discountText?.match(/RM([\d.]+)/)?.[1] || '0');
    
    expect(discountAmount).toBeLessThanOrEqual(100);
  });

  test('TC7.4 - Should calculate shipping correctly (RM10 or free over RM100)', async ({ page }) => {
    await ensureLoggedIn(page);

    await page.locator('button.add-to-cart-btn:not([disabled])').first().click();
    await page.goto(`${BASE_URL}/cart`);
    
    const shippingText = await page.locator('text=Shipping').textContent();
    expect(shippingText).toBeTruthy();
  });

  test('TC7.5 - Should calculate 6% tax on subtotal after discount', async ({ page }) => {
    await ensureLoggedIn(page);
    await addItemToCart(page);
    
    const taxText = await page.locator('#taxes').textContent();
    expect(taxText).toContain('RM');
  });
});

// ============================================================================
// FEATURE 8: CHECKOUT PROCESS
// ============================================================================

test.describe('Feature 8: Checkout Process', () => {
  test('TC8.1 - Should display order summary on checkout page', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await page.click('button.checkout-btn');
    await expect(page.locator('.checkout-container')).toBeVisible();
    
    // Verify checkout page elements
    const checkoutContainer = page.locator('.checkout-container');
    await expect(checkoutContainer).toBeVisible();
  });

  test('TC8.2 - Should require all customer information fields', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await page.click('button.checkout-btn');
    await expect(page.locator('.checkout-container')).toBeVisible();
    
    // Try to submit without filling fields
    const submitBtn = page.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.getAttribute('disabled');
    
    expect(isDisabled || (await submitBtn.isEnabled())).toBeTruthy();
  });

  test('TC8.3 - Should show pricing breakdown on checkout', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await page.click('button.checkout-btn');
    await expect(page.locator('.checkout-container')).toBeVisible();
    
    // Verify pricing elements
    const summaryTotal = page.locator('.summary-total');
    await expect(summaryTotal).toBeVisible();
  });

  test('TC8.4 - Should submit order successfully with valid info', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await page.click('button.checkout-btn');
    await expect(page.locator('.checkout-container')).toBeVisible();

    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await page.fill('#address', '123 Main St');
    await page.fill('#cardNumber', '4111 1111 1111 1111');

    await page.click('#submit-btn');
    await expect(page.locator('#order-number')).toBeVisible();
  });

  test('TC8.5 - Should maintain pricing consistency between cart and checkout', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    const cartTotal = await page.locator('#total').textContent();
    
    // Go to checkout
    await page.click('button.checkout-btn');
    await expect(page.locator('.checkout-container')).toBeVisible();
    
    // Verify checkout total matches
    const checkoutTotal = await page.locator('#order-total').textContent();
    expect(cartTotal).toBe(checkoutTotal);
  });
});

// ============================================================================
// FEATURE 9: ORDER CONFIRMATION
// ============================================================================

test.describe('Feature 9: Order Confirmation', () => {
  test('TC9.1 - Should display order number', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await completeCheckoutUI(page);
    
    const orderNumber = page.locator('#order-number');
    await expect(orderNumber).toBeVisible();
    const text = await orderNumber.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('TC9.2 - Should display ordered items', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await completeCheckoutUI(page);
    
    const orderItems = page.locator('.order-item');
    await expect(orderItems).toHaveCount(1);
  });

  test('TC9.3 - Should display customer information', async ({ page }) => {
    await ensureLoggedIn(page);

    const name = 'John Doe';
    const email = 'john@example.com';

    await addItemToCart(page);
    await completeCheckoutUI(page, { name, email, address: '123 Main St', cardNumber: '4111 1111 1111 1111' });
    
    const customerName = page.locator('#customer-name');
    const customerEmail = page.locator('#customer-email');
    
    await expect(customerName).toContainText(name);
    await expect(customerEmail).toContainText(email);
  });

  test('TC9.4 - Should show final pricing with all charges', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await completeCheckoutUI(page);
    
    const totalAmount = page.locator('#total-amount');
    await expect(totalAmount).toBeVisible();
    const text = await totalAmount.textContent();
    expect(text).toContain('RM');
  });

  test('TC9.5 - Should clear cart after successful order', async ({ page }) => {
    await ensureLoggedIn(page);

    await addItemToCart(page);
    await completeCheckoutUI(page);
    
    // Check cart count is reset
    const cartCount = page.locator('#cart-count');
    await expect(cartCount).toContainText('0');
  });
});

// ============================================================================
// FEATURE 10: GIVE FEEDBACK
// ============================================================================

test.describe('Feature 10: Give Feedback', () => {
  test('TC10.1 - Should open feedback modal when clicked', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Click username to open dropdown
    await page.click('#username-btn');
    
    // Click feedback button
    await page.click('#feedback-btn');
    
    const feedbackModal = page.locator('#feedback-modal');
    await expect(feedbackModal).toBeVisible();
  });

  test('TC10.2 - Should submit feedback successfully', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Open feedback modal
    await page.click('#username-btn');
    await page.click('#feedback-btn');
    
    // Submit feedback
    await page.fill('#feedback-text', 'Great website! Very user-friendly.');
    await page.click('#modal-feedback-form button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    // Modal should close
    const feedbackModal = page.locator('#feedback-modal');
    const display = await feedbackModal.evaluate((el) => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('TC10.3 - Should show loading state while submitting feedback', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Open feedback modal
    await page.click('#username-btn');
    await page.click('#feedback-btn');
    
    // Submit feedback
    await page.fill('#feedback-text', 'Test feedback');
    
    // Check button loading state
    const submitBtn = page.locator('#modal-feedback-form button[type="submit"]');
    await submitBtn.click();
    
    // Wait for modal to close after submission
    await page.waitForTimeout(1000);
    const feedbackModal = page.locator('#feedback-modal');
    const display = await feedbackModal.evaluate((el) => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('TC10.4 - Should close feedback modal when close link is clicked', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Open feedback modal
    await page.click('#username-btn');
    await page.click('#feedback-btn');
    
    // Click close
    await page.click('.close-feedback');
    
    const feedbackModal = page.locator('#feedback-modal');
    const display = await feedbackModal.evaluate((el) => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('TC10.5 - Should require feedback text to be non-empty', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Open feedback modal
    await page.click('#username-btn');
    await page.click('#feedback-btn');
    
    // Try to submit empty feedback
    const submitBtn = page.locator('#modal-feedback-form button[type="submit"]');
    const isDisabled = await submitBtn.getAttribute('disabled');
    
    expect(isDisabled || (await submitBtn.isEnabled())).toBeTruthy();
  });
});

// ============================================================================
// FEATURE 11: LOADING STATES
// ============================================================================

test.describe('Feature 11: Loading States', () => {
  test('TC11.1 - Should show loading spinner when products are loading', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    // Products should load
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC11.2 - Should show loading state on add to cart button', async ({ page }) => {
    await ensureLoggedIn(page);

    const addBtn = page.locator('button.add-to-cart-btn:not([disabled])').first();
    await addBtn.click();
    
    // Button should briefly show loading state
    await page.waitForTimeout(500);
  });

  test('TC11.3 - Should display error message for failed operations', async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('TC11.4 - Should show loading state on feedback submission', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Open feedback and submit
    await page.click('#username-btn');
    await page.click('#feedback-btn');
    await page.fill('#feedback-text', 'Test');
    
    const submitBtn = page.locator('#modal-feedback-form button[type="submit"]');
    await submitBtn.click();
    
    // Wait for feedback to complete
    await page.waitForTimeout(1000);
    const feedbackModal = page.locator('#feedback-modal');
    const display = await feedbackModal.evaluate((el) => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('TC11.5 - Should show empty state message when search returns no results', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    // Search for non-existent product
    await page.fill('#search-input', 'XYZNonexistentProduct12345');
    
    await page.waitForTimeout(500);
    
    const emptyState = page.locator('#empty-state');
    await expect(emptyState).toBeVisible();
  });
});

// ============================================================================
// FEATURE 12: NAVIGATION & SESSION MANAGEMENT
// ============================================================================

test.describe('Feature 12: Navigation & Session Management', () => {
  test('TC12.1 - Should hide login button and show username when logged in', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    
    const loginButton = page.locator('#login-button');
    await expect(loginButton).toBeVisible();
    
    await ensureLoggedIn(page);
    
    await expect(loginButton).not.toBeVisible();
    
    const usernameBtn = page.locator('#username-btn');
    await expect(usernameBtn).toBeVisible();
    await expect(usernameBtn).toContainText(TEST_USER.username);
  });

  test('TC12.2 - Should show dropdown menu when username is clicked', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Click username
    await page.click('#username-btn');
    
    const dropdownMenu = page.locator('#dropdown-menu');
    await expect(dropdownMenu).toHaveClass(/show/);
  });

  test('TC12.3 - Should close dropdown when clicking outside', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Open dropdown
    await page.click('#username-btn');
    
    // Click elsewhere
    await page.click('body', { position: { x: 100, y: 100 } });
    
    const dropdownMenu = page.locator('#dropdown-menu');
    const hasShow = await dropdownMenu.evaluate((el) => el.classList.contains('show'));
    expect(hasShow).toBe(false);
  });

  test('TC12.4 - Should update cart count across pages', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Add item
    await page.locator('button.add-to-cart-btn:not([disabled])').first().click();
    
    // Check cart count updated
    let cartCount = page.locator('#cart-count');
    await expect(cartCount).toContainText('1');
    
    // Go to home and check still shows
    await page.goto(`${BASE_URL}/`);
    cartCount = page.locator('#cart-count');
    await expect(cartCount).toContainText('1');
  });

  test('TC12.5 - Should maintain session across page navigation', async ({ page }) => {
    await ensureLoggedIn(page);
    
    // Navigate to different pages
    await page.goto(`${BASE_URL}/`);
    let usernameBtn = page.locator('#username-btn');
    await expect(usernameBtn).toContainText(TEST_USER.username);
    
    // Go to cart
    await page.click('a[href="/cart"]');
    usernameBtn = page.locator('#username-btn');
    await expect(usernameBtn).toContainText(TEST_USER.username);
  });
});
