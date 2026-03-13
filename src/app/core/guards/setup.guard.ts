import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SetupService } from '../services/setup.service';
import { map } from 'rxjs';

export const setupGuard: CanActivateFn = (route, state) => {
    const setupService = inject(SetupService);
    const router = inject(Router);

    return setupService.checkStatus().pipe(
        map(isSetupComplete => {
            if (isSetupComplete) {
                if (state.url === '/setup') {
                    return router.parseUrl('/login');
                }
                return true;
            }

            // If not complete, redirect to setup wizard
            if (state.url !== '/setup') {
                return router.parseUrl('/setup');
            }
            return true;
        })
    );
};
