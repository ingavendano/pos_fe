import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, THEME_OPTIONS, AppTheme } from '../../../core/services/theme/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-1">Tema visual</h3>
        <p class="text-xs text-gray-500">
          Define los colores de la interfaz para todos los usuarios de esta empresa.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        @for (option of themes; track option.id) {
          <button
            (click)="selectTheme(option.id)"
            [class.ring-2]="currentTheme() === option.id"
            [style.--ring-color]="option.primaryColor"
            class="relative flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200
                   hover:border-gray-300 transition-all text-left focus:outline-none"
            [class.border-transparent]="currentTheme() === option.id"
            [style.boxShadow]="currentTheme() === option.id
              ? '0 0 0 2px ' + option.primaryColor
              : 'none'">

            <!-- Preview del sidebar + contenido -->
            <div class="w-full h-14 rounded-lg overflow-hidden flex border border-gray-100">
              <div class="w-8 h-full flex-shrink-0"
                   [style.background]="option.sidebarColor">
                <div class="m-1.5 space-y-1">
                  <div class="h-1 rounded-full opacity-60" style="background:rgba(255,255,255,0.4)"></div>
                  <div class="h-1 rounded-full" [style.background]="option.primaryColor"></div>
                  <div class="h-1 rounded-full opacity-40" style="background:rgba(255,255,255,0.3)"></div>
                  <div class="h-1 rounded-full opacity-30" style="background:rgba(255,255,255,0.3)"></div>
                </div>
              </div>
              <div class="flex-1 bg-gray-50 p-1.5 space-y-1">
                <div class="h-2 rounded w-3/4" style="background:#E5E7EB"></div>
                <div class="h-3 rounded w-1/2" [style.background]="option.primaryColor + '33'"></div>
                <div class="h-2 rounded w-full" style="background:#F3F4F6"></div>
              </div>
            </div>

            <!-- Nombre y descripción -->
            <div class="w-full">
              <div class="text-xs font-semibold text-gray-800">{{ option.label }}</div>
              <div class="text-[10px] text-gray-500 leading-tight">{{ option.description }}</div>
            </div>

            <!-- Check si está activo -->
            @if (currentTheme() === option.id) {
              <div class="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                   [style.background]="option.primaryColor">
                <svg width="8" height="8" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            }
          </button>
        }
      </div>

      <!-- Botón guardar -->
      <div class="flex items-center gap-3 pt-2">
        <button
          (click)="save()"
          [disabled]="saving() || currentTheme() === savedTheme()"
          class="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
          [style.background]="saving() ? '#9CA3AF' : 'var(--color-primary-600)'">
          @if (saving()) {
            Guardando...
          } @else {
            Guardar tema
          }
        </button>
        @if (saved()) {
          <span class="text-xs text-green-600 font-medium">
            ✓ Tema guardado correctamente
          </span>
        }
      </div>
    </div>
  `
})
export class ThemeSelectorComponent {
  private themeService = inject(ThemeService);

  themes = THEME_OPTIONS;
  currentTheme = signal<AppTheme>(this.themeService.getCurrentTheme());
  savedTheme = signal<AppTheme>(this.themeService.getCurrentTheme());
  saving = signal(false);
  saved = signal(false);

  selectTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    // Preview instantáneo sin guardar
    this.themeService.applyTheme(theme);
  }

  save(): void {
    this.saving.set(true);
    this.saved.set(false);

    this.themeService.saveTheme(this.currentTheme()).subscribe({
      next: () => {
        this.savedTheme.set(this.currentTheme());
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        // Revertir al tema guardado si falla
        this.themeService.applyTheme(this.savedTheme());
        this.currentTheme.set(this.savedTheme());
      }
    });
  }
}
