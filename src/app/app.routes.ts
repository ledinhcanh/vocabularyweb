import { Routes } from '@angular/router';

import { WebLayout } from './layouts/web-layout/web-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Home } from './pages/home/home';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { UsersComponent } from './pages/admin/users/users.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: WebLayout,
    children: [
      { path: '', component: Home },
      {
        path: 'topics',
        loadComponent: () => import('./pages/topics/topics').then(m => m.Topics)
      },
      {
        path: 'study',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/study/study').then(m => m.Study)
      },
      {
        path: 'progress',
        loadComponent: () => import('./pages/progress/progress').then(m => m.ProgressComponent)
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/search/search').then(m => m.SearchComponent)
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin/categories/categories.component').then(m => m.AdminCategories)
      },
      {
        path: 'posts',
        loadComponent: () => import('./pages/admin/posts/posts.component').then(m => m.AdminPosts)
      },
      {
        path: 'topics',
        loadComponent: () => import('./pages/admin/topics/topics.component').then(m => m.AdminTopics)
      },
      {
        path: 'vocabularies',
        loadComponent: () => import('./pages/admin/vocabularies/vocabularies.component').then(m => m.AdminVocabularies)
      },
      { path: 'users', component: UsersComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];