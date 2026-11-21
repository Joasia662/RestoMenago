export type Role = 'WAITER' | 'ADMIN';

export type OrderStatus = 'OPEN' | 'IN_PREPARATION' | 'SERVED' | 'PAID' | 'CANCELLED';

export type MenuCategory = 'STARTER' | 'SOUP' | 'MAIN' | 'DESSERT' | 'DRINK';

// API keeps the codes, the user sees these names
export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  STARTER: 'Przystawka',
  SOUP: 'Zupa',
  MAIN: 'Danie główne',
  DESSERT: 'Deser',
  DRINK: 'Napój'
};

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Table {
  id: number;
  number: number;
  seats: number;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  category: MenuCategory;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  imageUrl: string | null;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note: string | null;
}

export interface OrderSummary {
  id: number;
  table: { id: number; number: number };
  waiter: { id: number; username: string };
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
}

export interface Page<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface NewOrderItem {
  menuItemId: number;
  quantity: number;
  note?: string;
}

// error body sent by the backend errorHandler
export interface ApiErrorBody {
  error: { code: string; message: string; details?: { field: string; message: string }[] };
}

export const ACTIVE_STATUSES: OrderStatus[] = ['OPEN', 'IN_PREPARATION', 'SERVED'];

// reads a human message from any HttpErrorResponse
export function errorMessage(err: unknown): string {
  const body = (err as { error?: ApiErrorBody })?.error;
  const details = body?.error?.details;
  if (details?.length) {
    return details.map(d => (d.field ? `${d.field}: ${d.message}` : d.message)).join(', ');
  }
  return body?.error?.message ?? 'Nie udało się połączyć z serwerem';
}
