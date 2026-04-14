import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemFeature {
  code: string;
  name: string;
  description: string;
}

export interface SubscriptionPlan {
  id?: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  isActive: boolean;
  features?: SystemFeature[];
  featureCodes?: string[]; 
}

export interface TenantSubscription {
  id: number;
  tenantId: number;
  tenantName: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  activeFeatures: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/subscriptions`;

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.API_URL}/plans`);
  }

  createPlan(plan: SubscriptionPlan): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(`${this.API_URL}/plans`, plan);
  }

  getFeatures(): Observable<SystemFeature[]> {
    return this.http.get<SystemFeature[]>(`${this.API_URL}/features`);
  }

  getCurrentSubscription(tenantId: number): Observable<TenantSubscription> {
    return this.http.get<TenantSubscription>(`${this.API_URL}/tenant/${tenantId}/current`);
  }

  applyPlan(planId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/apply/${planId}`, {});
  }
}
