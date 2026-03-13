import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SetupService } from '../../core/services/setup.service';

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
  router = inject(Router);
  fb = inject(FormBuilder);

  isSubmitting = false;
  errorMessage = '';

  componentsList = [
    { id: 'DASHBOARD', name: 'Dashboard' },
    { id: 'POS', name: 'Punto de Venta' },
    { id: 'PRODUCTS', name: 'Catálogo de Productos' },
    { id: 'ORDERS', name: 'Órdenes' },
    { id: 'USERS', name: 'Usuarios y Roles' }
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
        description: 'Mesero',
        permissions: this.componentsList.filter(c => c.id === 'POS' || c.id === 'ORDERS').map(c => ({
          component: c.id,
          canRead: true,
          canWrite: true,
          canDelete: false
        }))
      }]
    };

    this.setupService.runWizard(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Redirect to login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 400 && typeof err.error === 'string' && err.error.includes('already')) {
          // The backend says setup is already complete.
          (this.setupService as any).isSetupCompleteCached = true;
          this.router.navigate(['/login']);
          return;
        }
        this.errorMessage = 'Ocurrió un error en la configuración: ' + (err.error || err.message);
      }
    });
  }
}
