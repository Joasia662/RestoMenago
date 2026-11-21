import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItems } from '../../../core/services/menu-items';
import { MenuCategory, MenuItem, errorMessage } from '../../../core/models/api.models';

@Component({
  imports: [FormsModule],
  selector: 'app-menu-management-page',
  styleUrl: './menu-management-page.scss',
  templateUrl: './menu-management-page.html',
})
export class MenuManagementPage implements OnInit {
  private menuApi = inject(MenuItems);

  categories: MenuCategory[] = ['STARTER', 'SOUP', 'MAIN', 'DESSERT', 'DRINK'];
  items = signal<MenuItem[]>([]);
  error = signal('');

  name = '';
  category: MenuCategory = 'MAIN';
  price: number | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.menuApi.list().subscribe({
      next: page => this.items.set(page.data),
      error: err => this.error.set(errorMessage(err))
    });
  }

  create() {
    this.menuApi.create({ name: this.name, category: this.category, price: Number(this.price) }).subscribe({
      next: () => {
        this.name = '';
        this.price = null;
        this.error.set('');
        this.load();
      },
      error: err => this.error.set(errorMessage(err))
    });
  }

  toggle(item: MenuItem) {
    this.menuApi.setAvailable(item.id, !item.isAvailable).subscribe({
      next: () => this.load(),
      error: err => this.error.set(errorMessage(err))
    });
  }

  remove(item: MenuItem) {
    if (!confirm(`Usunąć "${item.name}"?`)) return;
    this.menuApi.remove(item.id).subscribe({
      next: () => this.load(),
      error: err => this.error.set(errorMessage(err))
    });
  }
}
