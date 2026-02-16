# ComputeRus E-commerce Application

A full-featured e-commerce web application built with Node.js + Express, fully written in TypeScript for both backend and frontend.

## Features

- User authentication with session management
- Product catalog with search, filtering, and sorting
- Shopping cart functionality
- Multi-step checkout process
- Order confirmation system
- Session-based state management
- Full TypeScript stack (frontend and backend)
- Modern bundling with esbuild
- Shared type definitions between frontend and backend

## Prerequisites
- Node.js (v18 or newer recommended)
- npm (comes with Node.js)

## Setup

1. Clone or download this repository
2. Open the project folder in Visual Studio Code
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

The app will be available at http://localhost:3000

### Default Credentials
- Username: `automation`
- Password: `testautomation123`

## Application Pages

1. **Welcome** (`/`) - Home page with navigation
2. **Login** (`/login-page`) - User authentication  
3. **Products** (`/products`) - Product catalog with search and sort
4. **Cart** (`/cart`) - Shopping cart management
5. **Checkout** (`/checkout`) - Order form and payment (login required)
6. **Order Confirmation** (`/order-confirmation`) - Order success page

## E-commerce Features

### Product Catalog
- 6 sample products (Laptop, Smartphone, Headphones, Smart Watch, Tablet, Camera)
- Search functionality
- Category filtering
- Sort by name or price
- Stock availability display
- Quantity selection

### Shopping Cart
- Add/remove items
- Update quantities
- Real-time price calculations
- Session persistence
- No login required for browsing

### Checkout Flow
- Login required to proceed
- Customer information form
- Payment details form
- Form validation (client & server)
- Order processing
- Order confirmation with order number

## Project Structure

```
├── server.ts                    # Express server (TypeScript)
├── build-client.js             # esbuild configuration for frontend
├── dist/                        # Compiled server JavaScript
├── src/
│   ├── client/                  # Frontend TypeScript
│   │   ├── welcome.ts
│   │   ├── login.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── checkout.ts
│   │   └── order-confirmation.ts
│   └── shared/                  # Shared types
│       └── types.ts
├── public/                      # Static assets
│   ├── js/                      # Compiled frontend bundles
│   │   ├── welcome.js
│   │   ├── login.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   └── order-confirmation.js
│   └── style.css
├── views/                       # HTML pages
│   ├── login.html
│   ├── welcome.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   └── order-confirmation.html
├── types/                       # TypeScript type definitions
│   └── express-session.d.ts
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── TYPESCRIPT.md               # TypeScript architecture guide
```

## Build Scripts

```bash
npm run build          # Build both server and client
npm run build:server   # Build only server TypeScript
npm run build:client   # Build only client TypeScript
npm start              # Build and start server (runs prestart hook)
npm run dev            # Build and start in development mode
```

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /api/auth-status` - Get current auth status

### Product Endpoints
- `GET /api/products` - Get all products

### Cart Endpoints
- `GET /api/cart` - Get cart contents
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `POST /api/cart/update` - Update item quantity

### Checkout Endpoints
- `POST /api/checkout` - Process order (requires authentication)
- `GET /api/order` - Get order details

## TypeScript Architecture

This project uses TypeScript for both frontend and backend:

- **Backend**: Compiled with `tsc` to `dist/`
- **Frontend**: Bundled with `esbuild` to `public/js/`
- **Shared Types**: Located in `src/shared/types.ts` and used by both

See [TYPESCRIPT.md](TYPESCRIPT.md) for detailed TypeScript setup and architecture.

## Key Features

### Type Safety
- Shared interfaces between frontend and backend
- Compile-time type checking
- Better IDE autocomplete and refactoring

### Authentication Flow
- Optional authentication for browsing products and cart
- Required authentication for checkout
- Session-based state management
- Dynamic login/logout buttons

### Modern Development
- ES2020 target with backward compatibility
- Source maps for debugging
- Fast rebuilds with esbuild
- Clean separation of concerns

## Notes

- All product data is hardcoded in `server.ts` for demonstration
- Cart and order data is stored in session (not persisted to database)
- Payment processing is simulated (no real payment gateway)
- Do not commit `node_modules/` or `dist/` folders

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User registration system
- Payment gateway integration
- Order history and tracking
- Admin panel for product management
- Real-time inventory updates
- Email notifications

## License

MIT
