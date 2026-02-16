import 'express-session';
import type { CartItem, Order } from '../src/shared/types';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    username?: string;
    isNewUser?: boolean;
    cart?: CartItem[];
    order?: Order;
  }
}
