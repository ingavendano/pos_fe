import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService, TenantSettings } from '../../../core/services/tenant.service';
import { ThemeSelectorComponent } from './theme-selector.component';

@Component({
    selector: 'app-tenant-settings-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ThemeSelectorComponent],
    templateUrl: './tenant-settings-page.component.html'
})
export default class TenantSettingsPageComponent {
    tenantService = inject(TenantService);

    isSaving = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

    formModel: TenantSettings = {
        id: 0,
        name: '',
        domain: '',
        currency: 'USD',
        currencySymbol: '$',
        nit: '',
        nrc: '',
        giro: ''
    };

    constructor() {
        // Reactively populate the form whenever tenant settings are loaded/updated
        effect(() => {
            const settings = this.tenantService.settings();
            if (settings) {
                this.formModel = { ...settings };
            }
        });
    }

    saveSettings() {
        this.isSaving.set(true);
        this.successMessage.set('');
        this.errorMessage.set('');

        this.tenantService.updateTenant(this.formModel.id, this.formModel).subscribe({
            next: (updated) => {
                this.successMessage.set('Configuración de la empresa actualizada correctamente.');
                this.formModel = { ...updated };
            },
            error: (err) => {
                console.error('Error updating tenant settings', err);
                this.errorMessage.set('Ocurrió un error al actualizar la configuración.');
            },
            complete: () => {
                this.isSaving.set(false);
            }
        });
    }
}

