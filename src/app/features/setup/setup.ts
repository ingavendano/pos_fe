import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SetupService } from '../../core/services/setup.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-setup',
  imports: [ReactiveFormsModule],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
})
export class SetupComponent {
  currentStep = 1;

  tenantForm: FormGroup;
  branchForm: FormGroup;
  warehouseForm: FormGroup;
  roleForm: FormGroup;
  adminForm: FormGroup;

  setupService = inject(SetupService);
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);

  isSubmitting = false;
  errorMessage = '';

  componentsList = [
    { id: 'DASHBOARD', name: 'Dashboard' },
    { id: 'POS', name: 'Punto de Venta / Mesas' },
    { id: 'KITCHEN', name: 'Cocina' },
    { id: 'INVOICES', name: 'Facturación' },
    { id: 'PRODUCTS', name: 'Catálogo de Productos' },
    { id: 'CATEGORIES', name: 'Categorías' },
    { id: 'INVENTORY', name: 'Inventario / Stock' },
    { id: 'CUSTOMERS', name: 'Clientes' },
    { id: 'REPORTS', name: 'Reportes y Estadísticas' },
    { id: 'SETTINGS', name: 'Configuración Empresa' },
    { id: 'BRANCHES', name: 'Sucursales' },
    { id: 'TABLES', name: 'Gestión de Mesas' },
    { id: 'USERS', name: 'Personal (Usuarios)' },
    { id: 'ROLES', name: 'Roles y Permisos' },
    { id: 'TAXES', name: 'Impuestos' }
  ];

  constructor() {
    this.tenantForm = this.fb.group({
      companyName: ['', Validators.required],
      domain: [window.location.hostname, Validators.required],
      currency: ['USD', Validators.required],
      currencySymbol: ['$', Validators.required],
    });

    this.branchForm = this.fb.group({
      branchName: ['', Validators.required],
      branchAddress: ['', Validators.required],
      branchPhone: [''],
    });

    this.warehouseForm = this.fb.group({
      warehouseName: ['Bodega Principal', Validators.required],
      warehouseDescription: [''],
    });

    this.roleForm = this.fb.group({});

    this.adminForm = this.fb.group({
      adminName: ['', Validators.required],
      adminUsername: ['', Validators.required],
      adminPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  nextStep() {
    if (this.currentStep === 1 && this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }
    if (this.currentStep === 2 && this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    if (this.currentStep === 3 && this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }
    // step 4 is informational roles view
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitSetup() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      ...this.tenantForm.value,
      ...this.branchForm.value,
      ...this.warehouseForm.value,
      ...this.adminForm.value,
      // Sending default full access roles for the Admin. Custom roles will be later configurable.
      roles: [{
        name: 'ADMIN',
        description: 'Administrador del Sistema',
        permissions: this.componentsList.map(c => ({
          component: c.id,
          canRead: true,
          canWrite: true,
          canDelete: true
        }))
      },
      {
        name: 'WAITER',
        description: 'Mesero / Operativo',
        permissions: this.componentsList.map(c => ({
          component: c.id,
          canRead: ['POS', 'KITCHEN', 'INVOICES', 'PRODUCTS', 'CATEGORIES', 'CUSTOMERS'].includes(c.id),
          canWrite: ['POS', 'KITCHEN', 'INVOICES', 'CUSTOMERS'].includes(c.id),
          canDelete: false
        }))
      }]
    };

    console.log('Sending wizard setup payload:', payload);

    this.setupService.runWizard(payload).subscribe({
      next: () => {
        console.log('Setup successfully completed');
        // Refresh company information (Name, theme, currency)
        this.authService.loadTenantInfo();
        
        this.isSubmitting = false;
        // Redirect to login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Setup error:', err);
        const msg = err.error || err.message || '';
        if (err.status === 400 && (msg.includes('already') || msg.includes('registrado'))) {
          // The backend says setup is already complete.
          // Correctly navigate to login anyway
          this.setupService.checkStatus().subscribe(); // Triggers internal refresh
          this.router.navigate(['/login']);
          return;
        }
        this.errorMessage = 'Ocurrió un error en la configuración: ' + msg;
      }
    });
  }
}
