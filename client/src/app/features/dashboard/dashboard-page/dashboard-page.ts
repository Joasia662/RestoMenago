import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Tables } from '../../../core/services/tables';
import { Orders } from '../../../core/services/orders';
import { ACTIVE_STATUSES, OrderSummary, Table, errorMessage } from '../../../core/models/api.models';
import { TableGrid } from '../table-grid/table-grid';
import { OrderPanel } from '../order-panel/order-panel';

@Component({
  imports: [TableGrid, OrderPanel],
  selector: 'app-dashboard-page',
  styleUrl: './dashboard-page.scss',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage implements OnInit {
  private tablesApi = inject(Tables);
  private ordersApi = inject(Orders);

  tables = signal<Table[]>([]);
  orders = signal<OrderSummary[]>([]);
  selectedTableId = signal<number | null>(null);
  error = signal('');

  // tableId -> its active order (OPEN, IN_PREPARATION or SERVED)
  activeOrders = computed(() => {
    const map: Record<number, OrderSummary> = {};
    for (const order of this.orders()) {
      if (ACTIVE_STATUSES.includes(order.status)) map[order.table.id] = order;
    }
    return map;
  });

  selectedTable = computed(() => this.tables().find(t => t.id === this.selectedTableId()) ?? null);

  ngOnInit() {
    this.load();
  }

  load() {
    forkJoin({ tables: this.tablesApi.list(), orders: this.ordersApi.list() }).subscribe({
      next: ({ tables, orders }) => {
        this.tables.set(tables);
        this.orders.set(orders.data);
        this.error.set('');
      },
      error: err => this.error.set(errorMessage(err))
    });
  }
}
