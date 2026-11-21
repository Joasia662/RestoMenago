import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItems } from '../../../core/services/menu-items';
import { MenuItem, NewOrderItem } from '../../../core/models/api.models';

@Component({
  imports: [FormsModule],
  selector: 'app-menu-picker',
  styleUrl: './menu-picker.scss',
  templateUrl: './menu-picker.html',
})
export class MenuPicker implements OnInit {
  private menuApi = inject(MenuItems);

  disabled = input(false);
  add = output<NewOrderItem>();

  menu = signal<MenuItem[]>([]);
  menuItemId: number | null = null;
  quantity = 1;
  note = '';

  ngOnInit() {
    this.menuApi.list(true).subscribe(page => this.menu.set(page.data));
  }

  submit() {
    if (!this.menuItemId) return;
    this.add.emit({
      menuItemId: this.menuItemId,
      quantity: this.quantity,
      ...(this.note.trim() ? { note: this.note.trim() } : {})
    });
    this.menuItemId = null;
    this.quantity = 1;
    this.note = '';
  }
}
