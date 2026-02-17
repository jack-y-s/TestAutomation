import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import type { Product, CartItem, CustomerInfo, Order } from './src/shared/types';
import { findUserByUsername, createUser, validatePassword, resetPassword, isNewUser } from './src/server/userStore';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const ROOT_DIR = process.cwd();

// Product data
const products: Product[] = [
  { id: 1, name: 'Dell XPS 15', price: 4499.99, description: '🔸 Intel Core i7-13700H processor<br>🔸 16GB DDR5 RAM, 512GB NVMe SSD<br>🔸 NVIDIA GeForce RTX 4050 graphics<br>🔸 15.6" FHD+ display with 100% sRGB<br>🔸 Perfect for content creation', image: '💻', stock: 10, category: 'Computer' },
  { id: 2, name: 'Samsung Galaxy S24', price: 3149.99, description: '🔸 Snapdragon 8 Gen 3 processor<br>🔸 8GB RAM, 256GB storage<br>🔸 6.2" Dynamic AMOLED 2X 120Hz display<br>🔸 Triple camera with 50MP main sensor<br>🔸 5G connectivity, all-day battery', image: '📱', stock: 15, category: 'Mobile' },
  { id: 3, name: 'Sony WH-1000XM5', price: 899.99, description: '🔸 Industry-leading noise cancellation<br>🔸 30-hour battery life<br>🔸 AI-powered adaptive sound control<br>🔸 Multipoint Bluetooth connectivity<br>🔸 Ultra-comfortable for all-day wear', image: '🎧', stock: 20, category: 'Audio' },
  { id: 4, name: 'Apple Watch Series 9', price: 1349.99, description: '🔸 Bright always-on Retina display<br>🔸 S9 chip for enhanced performance<br>🔸 ECG and blood oxygen monitoring<br>🔸 Sleep tracking, water resistant to 50m<br>🔸 Seamless iOS integration', image: '⌚', stock: 12, category: 'Wearable' },
  { id: 5, name: 'iPad Air 11-inch', price: 2024.99, description: '🔸 10.9" Liquid Retina display<br>🔸 M2 chip, 8GB RAM, 128GB storage<br>🔸 Supports Apple Pencil Pro<br>🔸 Magic Keyboard compatible<br>🔸 All-day battery life', image: '📲', stock: 8, category: 'Computer' },
  { id: 6, name: 'Canon EOS R6 Mark II', price: 3599.99, description: '🔸 24.2MP full-frame sensor<br>🔸 40 fps continuous shooting<br>🔸 4K 60p video recording<br>🔸 In-body image stabilization<br>🔸 Advanced autofocus with subject detection', image: '📷', stock: 0, category: 'Photography' },
  { id: 7, name: 'ASUS ROG Strix G16', price: 6749.99, description: '🔸 Intel Core i9-13980HX processor<br>🔸 NVIDIA RTX 4070 8GB, 16GB DDR5 RAM<br>🔸 1TB PCIe 4.0 SSD<br>🔸 16" QHD 240Hz display<br>🔸 Advanced cooling, Windows 11', image: '🎮', stock: 7, category: 'Computer' },
  { id: 8, name: 'AirPods Pro (2nd Gen)', price: 674.99, description: '🔸 Active noise cancellation<br>🔸 Adaptive transparency mode<br>🔸 Personalized spatial audio<br>🔸 MagSafe charging case, 30hrs total<br>🔸 Sweat and water resistant', image: '🎧', stock: 30, category: 'Audio' },
  { id: 9, name: 'iPad Pro 12.9-inch', price: 4049.99, description: '🔸 12.9" Liquid Retina XDR display<br>🔸 M2 chip, 8GB RAM, 256GB storage<br>🔸 ProMotion 120Hz, Face ID<br>🔸 Apple Pencil & Magic Keyboard support<br>🔸 Ultimate creative tool', image: '📲', stock: 6, category: 'Computer' },
  { id: 10, name: 'GoPro HERO12 Black', price: 1574.99, description: '🔸 5.3K60 video, 27MP photos<br>🔸 HyperSmooth 6.0 stabilization<br>🔸 HDR video, improved low-light<br>🔸 Waterproof, longer battery life<br>🔸 Unlimited cloud backup included', image: '🎥', stock: 10, category: 'Photography' },
  { id: 11, name: 'iPhone 15 Pro Max', price: 5399.99, description: '🔸 A17 Pro chip, titanium design<br>🔸 6.7" Super Retina XDR ProMotion<br>🔸 48MP camera, 5x optical zoom<br>🔸 USB-C connectivity, action button<br>🔸 256GB storage, iOS 17', image: '📱', stock: 8, category: 'Mobile' },
  { id: 12, name: 'Fitbit Charge 6', price: 584.99, description: '🔸 Built-in GPS tracking<br>🔸 Heart rate & stress monitoring<br>🔸 Sleep tracking, 7+ days battery<br>🔸 Google integration<br>🔸 Water resistant to 50m', image: '⌚', stock: 25, category: 'Wearable' },
  { id: 13, name: 'Custom Gaming PC', price: 5849.99, description: '🔸 AMD Ryzen 7 7800X3D processor<br>🔸 NVIDIA RTX 4070 Ti 12GB<br>🔸 32GB DDR5 RAM, 1TB NVMe Gen4 SSD<br>🔸 Liquid cooling, RGB lighting<br>🔸 Windows 11 Pro, pre-built & tested', image: '🖥️', stock: 5, category: 'Computer' },
  { id: 14, name: 'Google Pixel 8a', price: 1349.99, description: '🔸 Google Tensor G3 chip<br>🔸 8GB RAM, 128GB storage<br>🔸 6.1" OLED 120Hz display<br>🔸 AI-powered cameras<br>🔸 7 years of OS updates, pure Android', image: '📱', stock: 20, category: 'Mobile' },
  { id: 15, name: 'Audio-Technica ATH-M50x', price: 1799.99, description: '🔸 Professional studio monitor<br>🔸 45mm large-aperture drivers<br>🔸 Exceptional clarity & sound isolation<br>🔸 Detachable cables included<br>🔸 Trusted by audio professionals', image: '🎧', stock: 12, category: 'Audio' },
  { id: 16, name: 'Xiaomi Mi Band 8', price: 359.99, description: '🔸 1.62" AMOLED display<br>🔸 16-day battery life<br>🔸 150+ sports modes<br>🔸 Heart rate & blood oxygen monitoring<br>🔸 5ATM water resistance', image: '⌚', stock: 35, category: 'Wearable' },
  { id: 17, name: 'Sony A7 IV', price: 6749.99, description: '🔸 33MP full-frame sensor<br>🔸 10fps burst shooting<br>🔸 Real-time Eye AF for humans & animals<br>🔸 4K 60p video, 5-axis stabilization<br>🔸 Dual card slots, hybrid camera', image: '📷', stock: 0, category: 'Photography' },
  { id: 18, name: 'JBL Charge 5', price: 449.99, description: '🔸 Powerful JBL Pro Sound<br>🔸 20 hours of playtime<br>🔸 IP67 waterproof & dustproof<br>🔸 Built-in powerbank<br>🔸 PartyBoost multi-speaker pairing', image: '🔊', stock: 18, category: 'Audio' },
  { id: 19, name: 'Kindle Paperwhite', price: 809.99, description: '🔸 6.8" glare-free display<br>🔸 Adjustable warm light, 300 ppi<br>🔸 8GB storage for thousands of books<br>🔸 Weeks of battery life<br>🔸 Waterproof (IPX8), Audible integration', image: '📖', stock: 15, category: 'Computer' },
  { id: 20, name: 'Fujifilm Instax Mini 12', price: 584.99, description: '🔸 Instant credit card-sized photos<br>🔸 Automatic exposure adjustment<br>🔸 Close-up mode, selfie mirror<br>🔸 Compact lightweight design<br>🔸 Includes 10 instant film shots', image: '📸', stock: 12, category: 'Photography' },
  { id: 21, name: 'Samsung Galaxy Z Fold5', price: 8099.99, description: '🔸 7.6" main + 6.2" cover AMOLED<br>🔸 Snapdragon 8 Gen 2, 12GB RAM<br>🔸 Enhanced multitasking, S Pen support<br>🔸 Triple camera system<br>🔸 Refined hinge design', image: '📱', stock: 0, category: 'Mobile' },
  { id: 22, name: 'Ray-Ban Meta Smart Glasses', price: 2249.99, description: '🔸 Built-in camera for photos & videos<br>🔸 Open-ear audio speakers<br>🔸 Meta AI assistant, hands-free calling<br>🔸 Classic Wayfarer design<br>🔸 Prescription lens compatible', image: '🕶️', stock: 6, category: 'Wearable' },
  { id: 23, name: 'SteelSeries Arctis Nova Pro', price: 809.99, description: '🔸 High-fidelity audio drivers<br>🔸 360° spatial audio<br>🔸 Active noise cancellation<br>🔸 ClearCast Gen 2 mic with AI<br>🔸 GameDAC for EQ control', image: '🎮', stock: 22, category: 'Audio' },
  { id: 24, name: 'Acer Chromebook Spin 714', price: 1574.99, description: '🔸 Intel Core i5, 8GB RAM, 256GB SSD<br>🔸 14" touchscreen, 2-in-1 design<br>🔸 Up to 10 hours battery life<br>🔸 Fast, secure Chrome OS<br>🔸 Play Store access', image: '💻', stock: 14, category: 'Computer' },
  { id: 25, name: 'DJI Mini 4 Pro', price: 2699.99, description: '🔸 Under 249g, compact & foldable<br>🔸 4K HDR video, 48MP photos<br>🔸 Omnidirectional obstacle sensing<br>🔸 34-minute flight time<br>🔸 ActiveTrack 360°, includes RC-N2', image: '🚁', stock: 0, category: 'Photography' },
  { id: 26, name: 'OnePlus 12', price: 2249.99, description: '🔸 Snapdragon 8 Gen 3, 12GB RAM<br>🔸 6.82" AMOLED 120Hz display<br>🔸 5400mAh battery, 100W fast charging<br>🔸 Hasselblad-tuned triple camera<br>🔸 OxygenOS 14, premium features', image: '📱', stock: 16, category: 'Mobile' },
  { id: 27, name: 'Sonos Beam Gen 2', price: 1124.99, description: '🔸 Compact smart soundbar<br>🔸 Dolby Atmos support<br>🔸 Alexa & Google Assistant built-in<br>🔸 HDMI eARC, AirPlay 2<br>🔸 Expandable with Sonos speakers', image: '🔊', stock: 11, category: 'Audio' },
  { id: 28, name: 'Garmin Vivomove Sport', price: 1124.99, description: '🔸 Hidden touchscreen display<br>🔸 Analog hands with smart features<br>🔸 Fitness & health monitoring<br>🔸 Connected GPS, smart notifications<br>🔸 5 days battery in smartwatch mode', image: '⌚', stock: 13, category: 'Wearable' },
  { id: 29, name: 'Sony ZV-1F', price: 2024.99, description: '🔸 20.1MP sensor, ultra-wide 20mm lens<br>🔸 Product showcase mode<br>🔸 Background defocus<br>🔸 Directional 3-capsule mic<br>🔸 Flip-out screen, 4K video', image: '📸', stock: 9, category: 'Photography' },
  { id: 30, name: 'LG Gram 17', price: 4949.99, description: '🔸 Ultra-lightweight 17" (2.98 lbs)<br>🔸 Intel Core i7, 16GB RAM, 512GB SSD<br>🔸 2560x1600 display<br>🔸 Up to 19.5 hours battery life<br>🔸 Military-grade durability', image: '💻', stock: 8, category: 'Computer' },
];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(ROOT_DIR, 'public')));
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
  })
);

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'welcome.html'));
});

app.get('/login-page', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password, redirect } = req.body as { username?: string; password?: string; redirect?: string };
  const user = findUserByUsername(username || '');
  
  if (user && validatePassword(user, password || '')) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.isNewUser = isNewUser(user);
    if (redirect) {
      res.redirect(`/${redirect}`);
    } else {
      res.redirect('/');
    }
  } else {
    req.session.authenticated = false;
    req.session.username = undefined;
    req.session.isNewUser = false;
    const redirectParam = redirect ? `&redirect=${redirect}` : '';
    res.redirect(`/login-page?error=1${redirectParam}`);
  }
});

// AJAX login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const user = findUserByUsername(username || '');
  
  if (user && validatePassword(user, password || '')) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.isNewUser = isNewUser(user);
    res.json({ success: true, message: 'Login successful' });
  } else {
    req.session.authenticated = false;
    req.session.username = undefined;
    req.session.isNewUser = false;
    res.json({ success: false, message: 'Invalid username or password' });
  }
});

// Registration page
app.get('/register', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'register.html'));
});

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
  
  if (!username || !email || !password) {
    return res.json({ success: false, message: 'All fields are required' });
  }
  
  const result = createUser(username, email, password);
  res.json(result);
});

// Password reset page
app.get('/reset-password', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'reset-password.html'));
});

// Password reset endpoint
app.post('/api/reset-password', (req, res) => {
  const { username, newPassword } = req.body as { username?: string; newPassword?: string };
  
  if (!username || !newPassword) {
    return res.json({ success: false, message: 'Username and new password are required' });
  }
  
  const result = resetPassword(username, newPassword);
  res.json(result);
});

app.get('/welcome', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'welcome.html'));
});

app.get('/api/auth-status', (req, res) => {
  res.json({ 
    authenticated: !!req.session.authenticated,
    username: req.session.username,
    isNewUser: req.session.isNewUser || false
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Product routes
app.get('/products', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'products.html'));
});

app.get('/api/products', (_req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Cart routes
app.get('/cart', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'views', 'cart.html'));
});

app.get('/api/cart', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  res.json(req.session.cart);
});

app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === parseInt(productId));
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existingItem = req.session.cart.find((item: any) => item.productId === parseInt(productId));
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity) || 1;
  } else {
    req.session.cart.push({
      productId: parseInt(productId),
      name: product.name,
      price: product.price,
      quantity: parseInt(quantity) || 1
    });
  }

  res.json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/remove', (req, res) => {
  const { productId } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart = req.session.cart.filter((item: any) => item.productId !== parseInt(productId));
  res.json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const item = req.session.cart.find((item: any) => item.productId === parseInt(productId));
  if (item) {
    item.quantity = parseInt(quantity);
  }

  res.json({ success: true, cart: req.session.cart });
});

// Checkout routes
app.get('/checkout', (req, res) => {
  if (req.session.authenticated) {
    res.sendFile(path.join(ROOT_DIR, 'views', 'checkout.html'));
  } else {
    res.redirect('/login-page?redirect=checkout');
  }
});

app.post('/api/checkout', (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, email, address, cardNumber } = req.body;
  
  // Basic validation
  if (!name || !email || !address || !cardNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!req.session.cart || req.session.cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Calculate total
  const total = req.session.cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  // Store order info in session
  req.session.order = {
    orderNumber: Math.floor(Math.random() * 1000000),
    items: req.session.cart,
    total,
    customerInfo: { name, email, address }
  };

  // Clear cart
  req.session.cart = [];

  res.json({ success: true, orderNumber: req.session.order.orderNumber });
});

app.get('/order-confirmation', (req, res) => {
  if (req.session.authenticated && req.session.order) {
    res.sendFile(path.join(ROOT_DIR, 'views', 'order-confirmation.html'));
  } else {
    res.redirect('/');
  }
});

app.get('/api/order', (req, res) => {
  if (req.session.order) {
    res.json(req.session.order);
  } else {
    res.status(404).json({ error: 'No order found' });
  }
});

app.post('/api/feedback', (req, res) => {
  const { feedback } = req.body;
  
  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ error: 'Feedback cannot be empty' });
  }
  
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Must be logged in to submit feedback' });
  }
  
  try {
    const fs = require('fs');
    const feedbackFile = path.join(ROOT_DIR, 'feedback.json');
    
    let feedbacks: any[] = [];
    if (fs.existsSync(feedbackFile)) {
      const data = fs.readFileSync(feedbackFile, 'utf-8');
      feedbacks = JSON.parse(data);
    }
    
    feedbacks.push({
      username: req.session.username,
      feedback: feedback.trim(),
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
