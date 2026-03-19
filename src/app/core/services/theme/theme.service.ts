import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type AppTheme = 'indigo' | 'restaurant' | 'retail' | 'premium';

export interface ThemeOption {
  id: AppTheme;
  label: string;
  description: string;
  primaryColor: string;
  sidebarColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'indigo', label: 'Índigo', description: 'Tecnología / Genérico', primaryColor: '#4F46E5', sidebarColor: '#1E1B4B' },
  { id: 'restaurant', label: 'Restaurante', description: 'Gastronomía / Food service', primaryColor: '#DC2626', sidebarColor: '#7C1D1D' },
  { id: 'retail', label: 'Retail', description: 'Tienda / Comercio', primaryColor: '#0D9488', sidebarColor: '#134E4A' },
  { id: 'premium', label: 'Premium', description: 'Lujo / Sofisticado', primaryColor: '#9333EA', sidebarColor: '#1A0533' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/tenants`;

  applyTheme(theme: AppTheme | string): void {
    const body = document.body;
    THEME_OPTIONS.forEach(t => body.classList.remove(`theme-${t.id}`));
    body.classList.add(`theme-${theme}`);
  }

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
