import { Component, computed, input, output } from '@angular/core';
import { OrderSummary, Table } from '../../../core/models/api.models';

const LABELS: Record<string, string> = {
  FREE: 'wolny',
  OPEN: 'zamówienie otwarte',
  IN_PREPARATION: 'w kuchni',
  SERVED: 'podane'
};

@Component({
  selector: 'app-table-tile',
  styleUrl: './table-tile.scss',
  templateUrl: './table-tile.html',
})
export class TableTile {
  table = input.required<Table>();
  order = input<OrderSummary | null>(null);
  selected = input(false);
  canDelete = input(false);

  picked = output<void>();
  deleted = output<void>();

  state = computed(() => this.order()?.status ?? 'FREE');
  label = computed(() => LABELS[this.state()]);

  delete(event: Event) {
    event.stopPropagation(); // do not also open the table
    this.deleted.emit();
  }
}
