import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-theme-toggle',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button 
      class="theme-toggle-btn" 
      (click)="themeService.toggleTheme()"
      [attr.aria-label]="'Switch to ' + (themeService.theme() === 'light' ? 'dark' : 'light') + ' mode'"
    >
      <span class="material-symbols-outlined">
        {{ themeService.theme() === 'light' ? 'light_mode' : 'dark_mode' }}
      </span>
    </button>
  `,
    styles: [`
    .theme-toggle-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      width: 40px;
      height: 40px;

      &:hover {
        background-color: var(--bg-secondary);
        transform: rotate(15deg);
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }
  `]
})
export class ThemeToggleComponent {
    themeService = inject(ThemeService);
}
