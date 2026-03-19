import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AppTheme = 'indigo' | 'restaurant' | 'retail' | 'premium';

export interface ThemeOption {
  id: AppTheme;
  label: string;
  description: string;
  primaryColor: string;   // Para preview en el selector
  sidebarColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'indigo',
    label: 'Índigo',
    description: 'Tecnología / Genérico',
    primaryColor: '#4F46E5',
    sidebarColor: '#1E1B4B',
  },
  {
    id: 'restaurant',
    label: 'Restaurante',
    description: 'Gastronomía / Food service',
    primaryColor: '#DC2626',
    sidebarColor: '#7C1D1D',
  },
  {
    id: 'retail',
    label: 'Retail',
    description: 'Tienda / Comercio',
    primaryColor: '#0D9488',
    sidebarColor: '#134E4A',
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Lujo / Sofisticado',
    primaryColor: '#9333EA',
    sidebarColor: '#1A0533',
  },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/tenants`;

  /**
   * Aplica el tema en el <body> inmediatamente.
   * Llamar al iniciar la app con el tema que viene del backend.
   */
  applyTheme(theme: AppTheme | string): void {
    const body = document.body;
    // Quitar todos los temas anteriores
    THEME_OPTIONS.forEach(t => body.classList.remove(`theme-${t.id}`));
    // Aplicar el nuevo
    body.classList.add(`theme-${theme}`);
  }

  /**
   * Persiste el tema en el backend y lo aplica localmente.
   * Solo para ADMIN desde la pantalla de configuración.
   */
  saveTheme(theme: AppTheme): Observable<{ theme: string }> {
    return this.http.patch<{ theme: string }>(`${this.API_URL}/theme`, { theme }).pipe(
      tap(() => this.applyTheme(theme))
    );
  }

  getCurrentTheme(): AppTheme {
    const body = document.body;
    const found = THEME_OPTIONS.find(t => body.classList.contains(`theme-${t.id}`));
    return found?.id ?? 'indigo';
  }
}
