# TypeScript Full-Stack Setup

## Project Structure

```
├── src/
│   ├── client/          # Frontend TypeScript
│   │   ├── welcome.ts
│   │   ├── login.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── checkout.ts
│   │   └── order-confirmation.ts
│   └── shared/          # Shared types between frontend & backend
│       └── types.ts
├── public/
│   ├── js/             # Compiled frontend JavaScript bundles
│   └── style.css
├── views/              # HTML templates
├── types/              # TypeScript type definitions
├── server.ts           # Backend server (TypeScript)
├── build-client.js     # Client-side bundler script
├── tsconfig.json       # TypeScript configuration
└── package.json
```

## TypeScript Configuration

### Backend (server.ts)
- Compiled with `tsc` to `dist/server.js`
- Uses CommonJS modules
- Imports shared types from `src/shared/types.ts`

### Frontend (src/client/*.ts)
- Compiled with `esbuild` to `public/js/*.js`
- Each page has its own TypeScript file
- Bundled for browser with ES2020 target
- Includes source maps for debugging

### Shared Types (src/shared/types.ts)
- `Product` - Product catalog items
- `CartItem` - Shopping cart items  
- `CustomerInfo` - Customer details
- `Order` - Order information
- `AuthStatus` - Authentication state

## Build Process

```bash
npm run build          # Build both server and client
npm run build:server   # Build only server TypeScript
npm run build:client   # Build only client TypeScript
npm start              # Build and start server
```

## Development

1. **Make changes** to TypeScript files in `src/client/` or `server.ts`
2. **Run build** with `npm run build`
3. **Start server** with `npm start` (or it auto-builds with prestart)

## Benefits of TypeScript

✅ **Type Safety**: Catch errors at compile-time, not runtime  
✅ **Shared Types**: Frontend and backend use the same interfaces  
✅ **Better IDE Support**: Autocomplete, refactoring, inline documentation  
✅ **Maintainability**: Easier to understand and modify code  
✅ **Modern JavaScript**: Uses latest ES features with backward compatibility

## Example: Adding a New Page

1. Create `src/client/new-page.ts`
2. Import types: `import type { Product } from '../shared/types';`
3. Write TypeScript code with full type checking
4. Build will automatically create `public/js/new-page.js`
5. Reference in HTML: `<script src="/js/new-page.js"></script>`

## Type-Safe API Calls

```typescript
// Frontend knows exact response type
const response = await fetch('/api/products');
const products: Product[] = await response.json();

// TypeScript ensures correct property access
products.forEach(product => {
  console.log(product.name);   // ✅ Known property
  console.log(product.invalid); // ❌ Compile error
});
```

## Notes

- Source maps are generated in development for debugging
- Production builds can enable minification by setting `NODE_ENV=production`
- All frontend code is now strictly typed and validated at build time
