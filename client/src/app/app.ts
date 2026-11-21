import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './core/services/auth';
import { AppHeader } from './shared/app-header/app-header';

@Component({
  imports: [RouterOutlet, AppHeader],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(Auth);
}
