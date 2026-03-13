import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      @for (n of notifService.notifications(); track n.id) {
      <div class="pointer-events-auto flex items-start gap-3 rounded-xl shadow-lg border px-4 py-3 animate-slide-in"
        [class]="bgClass(n.type)">
        <span class="text-xl shrink-0 mt-0.5">{{ icon(n.type) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold leading-snug" [class]="titleClass(n.type)">{{ label(n.type) }}</p>
          <p class="text-xs text-gray-600 mt-0.5 leading-snug">{{ n.message }}</p>
        </div>
        <button (click)="notifService.dismiss(n.id)"
          class="shrink-0 text-gray-400 hover:text-gray-600 transition mt-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in { animation: slide-in 0.3s ease-out; }
  `]
})
export class NotificationToastComponent {
  notifService = inject(NotificationService);

  icon(type: string): string {
    const icons: Record<string, string> = {
      new_order: '🔔',
      order_paid: '✅',
      cash_register: '💰',
      error: '❌',
      success: '✅',
      warn: '⚠️',
      info: 'ℹ️',
    };
    return icons[type] ?? '📣';
  }

  label(type: string): string {
    const labels: Record<string, string> = {
      new_order: 'Nueva Orden',
      order_paid: 'Orden Cobrada',
      cash_register: 'Caja',
      error: 'Error de Sistema',
      success: 'Operación Exitosa',
      warn: 'Advertencia',
      info: 'Información',
    };
    return labels[type] ?? 'Notificación';
  }

  bgClass(type: string): string {
    const classes: Record<string, string> = {
      new_order: 'bg-indigo-50 border-indigo-200',
      order_paid: 'bg-green-50 border-green-200',
      cash_register: 'bg-amber-50 border-amber-200',
      error: 'bg-red-50 border-red-200',
      success: 'bg-green-50 border-green-200',
      warn: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200',
    };
    return classes[type] ?? 'bg-white border-gray-200';
  }

  titleClass(type: string): string {
    const classes: Record<string, string> = {
      new_order: 'text-indigo-700',
      order_paid: 'text-green-700',
      cash_register: 'text-amber-700',
      error: 'text-red-700',
      success: 'text-green-700',
      warn: 'text-yellow-700',
      info: 'text-blue-700',
    };
    return classes[type] ?? 'text-gray-700';
  }
}
