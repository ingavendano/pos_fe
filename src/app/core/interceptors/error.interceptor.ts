import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
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
                        // No mostramos notificación para /me porque es una llamada
                        // silenciosa en background — el logout ya redirige al login.
                        if (req.url.includes('/auth/me')) {
                            return throwError(() => error);
                        }
                        errorMsg = 'Tu sesión ha expirado. Iniciando sesión nuevamente...';
                        notificationService.show(errorMsg, 'error');
                        // Logout limpio — redirige a /login automáticamente
                        authService.logout();
                        return throwError(() => error);

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
