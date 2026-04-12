import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMsg = 'Ha ocurrido un error inesperado.';

            if (error.error instanceof ErrorEvent) {
                // Error del lado del cliente (red, JS, etc.)
                errorMsg = `Error: ${error.error.message}`;
            } else {
                switch (error.status) {
                    case 0:
                        errorMsg = 'Sin conexión con el servidor. Verifica tu internet.';
                        break;

                    case 401:
                        // Intentar refresh silencioso y reintentar 1 vez.
                        // No aplicamos refresh a endpoints de auth para evitar loops.
                        if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
                            authService.logout();
                            return throwError(() => error);
                        }

                        // /me puede fallar si el token expira: igual intentamos refresh.
                        if (req.headers.has('x-refresh-attempt')) {
                            errorMsg = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
                            notificationService.show(errorMsg, 'error');
                            authService.logout();
                            return throwError(() => error);
                        }

                        return authService.refreshAccessToken().pipe(
                            switchMap((fresh) => {
                                const retried = req.clone({
                                    setHeaders: {
                                        Authorization: `Bearer ${fresh.token}`,
                                        'x-refresh-attempt': '1',
                                    },
                                });
                                return next(retried);
                            }),
                            catchError(() => {
                                errorMsg = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
                                notificationService.show(errorMsg, 'error');
                                authService.logout();
                                return throwError(() => error);
                            })
                        );

                    case 403:
                        errorMsg = 'No tienes permisos para realizar esta acción.';
                        break;

                    case 404:
                        // Silencioso para endpoints de verificación (tenant info, setup status)
                        if (req.url.includes('/public/info') || req.url.includes('/setup/status')) {
                            return throwError(() => error);
                        }
                        errorMsg = 'El recurso solicitado no fue encontrado.';
                        break;

                    default:
                        if (error.status >= 500) {
                            errorMsg = 'Error interno del servidor. Intenta más tarde.';
                        } else if (error.error?.message) {
                            errorMsg = error.error.message;
                        } else if (typeof error.error === 'string') {
                            errorMsg = error.error;
                        } else {
                            errorMsg = `Error ${error.status}: ${error.statusText}`;
                        }
                }
            }

            notificationService.show(errorMsg, 'error');
            return throwError(() => error);
        })
    );
};
