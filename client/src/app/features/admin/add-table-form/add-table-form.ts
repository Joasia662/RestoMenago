import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tables } from '../../../core/services/tables';
import { errorMessage } from '../../../core/models/api.models';

@Component({
  imports: [FormsModule],
  selector: 'app-add-table-form',
  styleUrl: './add-table-form.scss',
  templateUrl: './add-table-form.html',
})
export class AddTableForm {
  private tablesApi = inject(Tables);

  created = output<void>();

  open = signal(false);
  error = signal('');
  number: number | null = null;
  seats = 4;

  submit() {
    if (!this.number) return;
    this.tablesApi.create(this.number, this.seats).subscribe({
      next: () => {
        this.open.set(false);
        this.error.set('');
        this.number = null;
        this.seats = 4;
        this.created.emit();
      },
      error: err => this.error.set(errorMessage(err))
    });
  }
}
