// Shared types between frontend and backend

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  address: string;
}

export interface Order {
  orderNumber: number;
  items: CartItem[];
  total: number;
  customerInfo: CustomerInfo;
}

export interface AuthStatus {
  authenticated: boolean;
  username?: string;
  isNewUser?: boolean;
}
