import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        const requiredPermission = route.data['permission'];
        if (requiredPermission && !authService.hasPermission(requiredPermission)) {
            // Logged in but no permission for this module
            console.warn(`User does not have permission for ${requiredPermission}. Redirecting to POS.`);
            return router.parseUrl('/pos');
        }
        return true;
    }

    // Not logged in, so redirect to login page with the return url
    return router.parseUrl('/login');
};
