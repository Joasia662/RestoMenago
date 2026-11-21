import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MenuCategory, MenuItem, Page } from '../models/api.models';

@Service()
export class MenuItems {
  private http = inject(HttpClient);

  list(onlyAvailable = false) {
    let params = new HttpParams().set('pageSize', 100);
    if (onlyAvailable) params = params.set('available', 'true');
    return this.http.get<Page<MenuItem>>('/api/menu-items', { params });
  }

  create(item: { name: string; category: MenuCategory; price: number }) {
    return this.http.post<MenuItem>('/api/menu-items', item);
  }

  setAvailable(id: number, isAvailable: boolean) {
    return this.http.patch<MenuItem>(`/api/menu-items/${id}`, { isAvailable });
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/menu-items/${id}`);
  }
}
