import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn) {
        // Kiểm tra phân quyền Admin
        if (state.url.startsWith('/admin') && !authService.isAdmin) {
            // Không phải admin, không cho vào admin
            return router.createUrlTree(['/study']);
        }
        return true;
    }

    // Not logged in, redirect to login
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
