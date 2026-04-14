import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService, SubscriptionPlan, SystemFeature } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-plans.component.html',
})
export class SubscriptionPlansComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);

  plans = signal<SubscriptionPlan[]>([]);
  features = signal<SystemFeature[]>([]);

  showModal = signal(false);
  expandedPlan = signal<number | null>(null);

  newPlan: SubscriptionPlan = {
    name: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY',
    isActive: true,
    featureCodes: []
  };

  ngOnInit(): void {
    // Load features first so they are ready when plans load
    this.loadFeatures();
    this.loadPlans();
  }

  loadPlans() {
    this.subscriptionService.getPlans().subscribe({
      next: (data) => this.plans.set(data),
      error: () => console.error('Error al cargar planes')
    });
  }

  loadFeatures() {
    this.subscriptionService.getFeatures().subscribe({
      next: (data) => this.features.set(data),
      error: () => console.error('Error al cargar funcionalidades')
    });
  }

  /** Returns true if the given plan includes this feature code */
  planHasFeature(plan: SubscriptionPlan, featureCode: string): boolean {
    return plan.features?.some(f => f.code === featureCode) ?? false;
  }

  toggleExpand(planId: number | undefined) {
    if (!planId) return;
    this.expandedPlan.set(this.expandedPlan() === planId ? null : planId);
  }

  getFeatureColor(code: string): string {
    const colors: Record<string, string> = {
      'MODULE_POS': 'text-blue-500 bg-blue-50',
      'MODULE_KITCHEN': 'text-orange-500 bg-orange-50',
      'MODULE_INVENTORY': 'text-emerald-500 bg-emerald-50',
      'MODULE_TABLES': 'text-purple-500 bg-purple-50',
      'MODULE_REPORTS': 'text-amber-500 bg-amber-50',
      'MODULE_EXPENSES': 'text-rose-500 bg-rose-50',
      'MODULE_USERS': 'text-cyan-500 bg-cyan-50',
      'MODULE_ROLES': 'text-indigo-500 bg-indigo-50',
      'MODULE_CUSTOMERS': 'text-sky-500 bg-sky-50',
      'MODULE_TAXES': 'text-green-500 bg-green-50',
      'MODULE_CASH_REGISTER': 'text-red-500 bg-red-50',
      'MODULE_CATEGORIES': 'text-teal-500 bg-teal-50',
      'MODULE_PRODUCTS': 'text-violet-500 bg-violet-50',
      'MODULE_BRANCHES': 'text-pink-500 bg-pink-50',
      'MODULE_SETTINGS': 'text-slate-500 bg-slate-50',
      'MODULE_INVOICES': 'text-blue-600 bg-blue-50'
    };
    return colors[code] || 'text-gray-500 bg-gray-50';
  }

  getFeatureIcon(code: string): string {
    const icons: Record<string, string> = {
      'MODULE_POS': 'shopping-cart',
      'MODULE_KITCHEN': 'utensils',
      'MODULE_INVENTORY': 'archive',
      'MODULE_TABLES': 'grid',
      'MODULE_REPORTS': 'bar-chart-2',
      'MODULE_EXPENSES': 'dollar-sign',
      'MODULE_USERS': 'users',
      'MODULE_ROLES': 'shield',
      'MODULE_CUSTOMERS': 'user-check',
      'MODULE_TAXES': 'percent',
      'MODULE_CASH_REGISTER': 'lock',
      'MODULE_CATEGORIES': 'list',
      'MODULE_PRODUCTS': 'package',
      'MODULE_BRANCHES': 'map-pin',
      'MODULE_SETTINGS': 'settings',
      'MODULE_INVOICES': 'file-text'
    };
    return icons[code] || 'check-circle';
  }

  onApplyPlan(planId: number | undefined) {
    if (!planId) return;
    if (confirm('¿Estás seguro de que deseas cambiar a este plan?')) {
      this.subscriptionService.applyPlan(planId).subscribe({
        next: () => {
          alert('Plan aplicado exitosamente. Por favor, reinicia la aplicación para actualizar tus permisos.');
          window.location.reload();
        },
        error: () => alert('Error al aplicar el plan.')
      });
    }
  }

  openModal() {
    this.newPlan = {
      name: '',
      description: '',
      price: 0,
      billingCycle: 'MONTHLY',
      isActive: true,
      featureCodes: []
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  toggleFeature(code: string) {
    if (!this.newPlan.featureCodes) this.newPlan.featureCodes = [];
    const index = this.newPlan.featureCodes.indexOf(code);
    if (index > -1) {
      this.newPlan.featureCodes.splice(index, 1);
    } else {
      this.newPlan.featureCodes.push(code);
    }
  }

  hasSelectedFeature(code: string): boolean {
    return this.newPlan.featureCodes?.includes(code) ?? false;
  }

  savePlan() {
    if (!this.newPlan.name || this.newPlan.price < 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    this.subscriptionService.createPlan(this.newPlan).subscribe({
      next: () => {
        alert('Plan de suscripción creado exitosamente');
        this.loadPlans();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error al crear el plan', err);
        alert('Error al crear el plan');
      }
    });
  }
}
