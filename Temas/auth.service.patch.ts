// Cambio puntual en auth.service.ts
// Agrega ThemeService y aplica el tema cuando llega tenantInfo

// 1. Importa ThemeService:
import { ThemeService } from './theme.service';

// 2. En el constructor, inyéctalo:
//    private themeService = inject(ThemeService);

// 3. En loadTenantInfo(), aplica el tema al recibirlo:
loadTenantInfo(): void {
    this.http.get<PublicTenantResponse>(`${environment.apiUrl}/tenants/public/info`)
        .subscribe({
            next: (info) => {
                this.tenantInfo.set(info);
                this.domainRegistered.set(true);
                // Aplica el tema del tenant al <body> inmediatamente
                if (info.theme) {
                    this.themeService.applyTheme(info.theme);
                }
            },
            error: (err) => {
                console.warn('No se pudo cargar la información del tenant.');
                if (err.status === 404) {
                    this.domainRegistered.set(false);
                }
            }
        });
}

// Nota: PublicTenantResponse también debe incluir theme:
export interface PublicTenantResponse {
    name: string;
    currencySymbol: string;
    currency: string;
    theme: string;   // ← agrega esto
}
