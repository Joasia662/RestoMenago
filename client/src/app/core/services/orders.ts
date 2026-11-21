import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NewOrderItem, Order, OrderStatus, OrderSummary, Page } from '../models/api.models';

@Service()
export class Orders {
  private http = inject(HttpClient);

  list() {
    const params = new HttpParams().set('pageSize', 100);
    return this.http.get<Page<OrderSummary>>('/api/orders', { params });
  }

  get(id: number) {
    return this.http.get<Order>(`/api/orders/${id}`);
  }

  create(tableId: number) {
    return this.http.post<Order>('/api/orders', { tableId });
  }

  addItem(orderId: number, item: NewOrderItem) {
    return this.http.post<Order>(`/api/orders/${orderId}/items`, item);
  }

  removeItem(orderId: number, itemId: number) {
    return this.http.delete<Order>(`/api/orders/${orderId}/items/${itemId}`);
  }

  changeStatus(orderId: number, status: OrderStatus) {
    return this.http.patch<Order>(`/api/orders/${orderId}/status`, { status });
  }
}
