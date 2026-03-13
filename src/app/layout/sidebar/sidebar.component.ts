import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CashRegisterService } from '../../core/services/cash-register.service';
import { AuthService } from '../../core/services/auth.service';
import { InventoryService } from '../../core/services/inventory.service';
import { Inventory } from '../../core/api/model';
import packageJson from '../../../../package.json';
import { TenantService, TenantSettings } from '../../core/services/tenant.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  private cashRegisterService = inject(CashRegisterService);
  private authService = inject(AuthService);
  private inventoryService = inject(InventoryService);
  tenantService = inject(TenantService);

  // Grupos del Sidebar
  salesOpen = signal(true);
  catalogOpen = signal(false);
  customersOpen = signal(false);
  inventoryOpen = signal(false);
  adminOpen = signal(false);
  reportsOpen = signal(false);

  lowStockCount = signal(0);
  version = packageJson.version;

  tenantModel = computed(() => {
    return this.tenantService.settings();
  });

  /** true = caja abierta, false = caja cerrada (o desconocido) */
  ngOnInit(): void {
    // Check initial status
    this.cashRegisterService.refreshStatus();
    this.loadAlerts();

    // Las configuraciones se manejan reactivamente mediante el computed tenantModel
  }

  loadAlerts(): void {
    this.inventoryService.getLowStockAlerts().subscribe((list: Inventory[]) => {
      this.lowStockCount.set(list.length);
    });
  }

  /** Computed getter for template ease of use */
  registerIsOpen() {
    return this.cashRegisterService.status() === 'OPEN';
  }

  hasPermission(component: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;

    // Admin has full access
    if (user.role === 'ADMIN') return true;

    // Check if the role has read permission for this specific component
    const permission = user.permissions?.find(p => p.component === component);
    return permission ? permission.canRead : false;
  }
}
