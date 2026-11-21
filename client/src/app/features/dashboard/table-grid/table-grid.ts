import { Component, inject, input, output, signal } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Tables } from '../../../core/services/tables';
import { OrderSummary, Table, errorMessage } from '../../../core/models/api.models';
import { TableTile } from '../table-tile/table-tile';
import { AddTableForm } from '../../admin/add-table-form/add-table-form';

@Component({
  imports: [TableTile, AddTableForm],
  selector: 'app-table-grid',
  styleUrl: './table-grid.scss',
  templateUrl: './table-grid.html',
})
export class TableGrid {
  protected auth = inject(Auth);
  private tablesApi = inject(Tables);

  tables = input.required<Table[]>();
  activeOrders = input.required<Record<number, OrderSummary>>();
  selectedId = input<number | null>(null);

  selected = output<number>();
  changed = output<void>();

  error = signal('');

  remove(table: Table) {
    if (!confirm(`Usunąć stolik ${table.number}?`)) return;

    this.tablesApi.remove(table.id).subscribe({
      next: () => this.changed.emit(),
      error: err => this.error.set(errorMessage(err))
    });
  }
}
