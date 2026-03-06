import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  authService = inject(AuthService);
  categoryService = inject(CategoryService);
  private router = inject(Router);

  searchKeyword = signal<string>('');

  constructor() {
    this.categoryService.getCategories().subscribe();
  }

  onSearch() {
    const keyword = this.searchKeyword().trim();
    if (keyword) {
      this.router.navigate(['/search'], { queryParams: { q: keyword } });
    }
  }
}
