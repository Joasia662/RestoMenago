import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Table } from '../models/api.models';

@Service()
export class Tables {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Table[]>('/api/tables');
  }

  create(number: number, seats: number) {
    return this.http.post<Table>('/api/tables', { number, seats });
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/tables/${id}`);
  }
}
