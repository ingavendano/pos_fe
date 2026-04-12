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
  
  newPlan: SubscriptionPlan = {
    name: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY',
    isActive: true,
    featureCodes: []
  };

  ngOnInit(): void {
    this.loadPlans();
    this.loadFeatures();
  }

  loadPlans() {
    this.subscriptionService.getPlans().subscribe({
      next: (data) => this.plans.set(data),
      error: (err) => console.error('Error al cargar planes')
    });
  }

  loadFeatures() {
    this.subscriptionService.getFeatures().subscribe({
      next: (data) => this.features.set(data),
      error: (err) => console.error('Error al cargar funcionalidades')
    });
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
      next: (created) => {
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
