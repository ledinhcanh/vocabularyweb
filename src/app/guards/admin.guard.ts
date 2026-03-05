import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn && authService.isAdmin) {
        return true;
    }

    // Not admin or not logged in, redirect to login or home
    // If logged in but not admin, maybe redirect to home
    if (authService.isLoggedIn) {
        return router.createUrlTree(['/']);
    }

    return router.createUrlTree(['/login']);
};
