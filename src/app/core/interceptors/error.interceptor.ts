import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);

    // We don't want to alert on some polling endpoints silently failing, but let's intercept all for now.
    // We can skip intercepting for certain URLs if needed later.
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMsg = 'Ha ocurrido un error inesperado.';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMsg = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                if (error.status === 0) {
                    errorMsg = 'Sin conexión con el servidor. Verifica tu internet.';
                } else if (error.status === 401) {
                    errorMsg = 'Tu sesión ha expirado o es inválida.';
                } else if (error.status === 403) {
                    errorMsg = 'No tienes permisos para realizar esta acción.';
                } else if (error.status >= 500) {
                    errorMsg = 'Error interno del servidor. Intenta más tarde.';
                } else if (error.error && error.error.message) {
                    errorMsg = error.error.message;
                } else if (typeof error.error === 'string') {
                    errorMsg = error.error;
                } else {
                    errorMsg = `Error ${error.status}: ${error.statusText}`;
                }
            }

            // Evitar saturar con errores de polling si falla la conexion repetidamente.
            // Solamente advertimos por error.
            notificationService.show(errorMsg, 'error');

            return throwError(() => error);
        })
    );
};
