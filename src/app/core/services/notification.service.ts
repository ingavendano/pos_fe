import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface AppNotification {
    id: number;
    type: string;
    message: string;
    timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private eventSource: EventSource | null = null;
    private idCounter = 0;

    notifications = signal<AppNotification[]>([]);

    connect(): void {
        const tenantId = this.authService.currentUser()?.tenantId;
        const token = this.authService.getToken();
        if (!tenantId || this.eventSource || !token) return;

        // Pedimos un token SSE de vida corta para no exponer el access token real en querystring.
        const tokenUrl = `${environment.apiUrl}/notifications/stream/token?tenantId=${tenantId}`;
        console.log(`[NotificationService] Requesting SSE token from: ${tokenUrl}`);

        this.http.get<{ token: string }>(tokenUrl)
            .subscribe({
                next: ({ token: sseToken }) => {
                    console.log('[NotificationService] SSE token received successfully');
                    const url = `${environment.apiUrl}/notifications/stream/tenant/${tenantId}?token=${encodeURIComponent(sseToken)}`;
                    console.log(`[NotificationService] Opening EventSource to: ${url}`);
                    this.eventSource = new EventSource(url, { withCredentials: false });
                    this.bindListeners();
                },
                error: (err) => {
                    console.error('[NotificationService] Error requesting SSE token:', err);
                    console.error('[NotificationService] Backend at', environment.apiUrl, 'might be unreachable or refusing connection.');
                    // Reintentar silencioso después de 10s
                    setTimeout(() => this.connect(), 10_000);
                }
            });
    }

    private bindListeners(): void {
        if (!this.eventSource) return;

        const handleEvent = (type: string) => (event: MessageEvent) => {
            let message = event.data;
            try {
                const parsed = JSON.parse(event.data);
                message = parsed.message ?? event.data;
            } catch { /* raw string */ }

            const notif: AppNotification = {
                id: ++this.idCounter,
                type,
                message,
                timestamp: new Date()
            };
            this.notifications.update(list => [notif, ...list].slice(0, 20));

            // Auto-dismiss after 6s
            setTimeout(() => this.dismiss(notif.id), 6000);
        };

        this.eventSource.addEventListener('new_order', handleEvent('new_order') as EventListener);
        this.eventSource.addEventListener('order_paid', handleEvent('order_paid') as EventListener);
        this.eventSource.addEventListener('cash_register', handleEvent('cash_register') as EventListener);

        this.eventSource.onopen = () => {
            console.log('[NotificationService] EventSource connection established safely');
        };

        this.eventSource.onerror = (err) => {
            console.error('[NotificationService] EventSource failed or closed:', err);
            // Reconnect silently after 10s if the connection drops
            this.disconnect();
            setTimeout(() => this.connect(), 10_000);
        };
    }

    show(message: string, type: 'error' | 'success' | 'warn' | 'info' | string = 'info'): void {
        const notif: AppNotification = {
            id: ++this.idCounter,
            type,
            message,
            timestamp: new Date()
        };
        this.notifications.update(list => [notif, ...list].slice(0, 20));
        setTimeout(() => this.dismiss(notif.id), 6000);
    }

    dismiss(id: number): void {
        this.notifications.update(list => list.filter(n => n.id !== id));
    }

    disconnect(): void {
        this.eventSource?.close();
        this.eventSource = null;
    }

    ngOnDestroy(): void { this.disconnect(); }
}
