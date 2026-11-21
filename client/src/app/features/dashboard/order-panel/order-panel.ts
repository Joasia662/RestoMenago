import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Orders } from '../../../core/services/orders';
import { NewOrderItem, Order, OrderStatus, Table, errorMessage } from '../../../core/models/api.models';
import { MenuPicker } from '../menu-picker/menu-picker';

const STATUS_LABELS: Record<OrderStatus, string> = {
  OPEN: 'otwarte',
  IN_PREPARATION: 'w kuchni',
  SERVED: 'podane',
  PAID: 'zapłacone',
  CANCELLED: 'anulowane'
};

@Component({
  imports: [MenuPicker],
  selector: 'app-order-panel',
  styleUrl: './order-panel.scss',
  templateUrl: './order-panel.html',
})
export class OrderPanel {
  private ordersApi = inject(Orders);

  table = input.required<Table>();
  orderId = input<number | null>(null);

  changed = output<void>();
  closed = output<void>();

  order = signal<Order | null>(null);
  error = signal('');
  busy = signal(false);

  statusLabel = computed(() => (this.order() ? STATUS_LABELS[this.order()!.status] : ''));
  editable = computed(() => ['OPEN', 'IN_PREPARATION'].includes(this.order()?.status ?? ''));

  constructor() {
    // load the order whenever another table / order is selected
    effect(() => {
      const id = this.orderId();
      this.error.set('');
      if (id === null) {
        this.order.set(null);
        return;
      }
      this.ordersApi.get(id).subscribe({
        next: order => this.order.set(order),
        error: err => this.error.set(errorMessage(err))
      });
    });
  }

  openOrder() {
    this.run(this.ordersApi.create(this.table().id));
  }

  addItem(item: NewOrderItem) {
    this.run(this.ordersApi.addItem(this.order()!.id, item));
  }

  removeItem(itemId: number) {
    this.run(this.ordersApi.removeItem(this.order()!.id, itemId));
  }

  setStatus(status: OrderStatus) {
    this.run(this.ordersApi.changeStatus(this.order()!.id, status));
  }

  // every action: call API, show the updated order, refresh the tables on the left
  private run(request: Observable<Order>) {
    this.busy.set(true);
    this.error.set('');

    request.subscribe({
      next: order => {
        this.order.set(order);
        this.busy.set(false);
        this.changed.emit();
      },
      error: err => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      }
    });
  }
}
