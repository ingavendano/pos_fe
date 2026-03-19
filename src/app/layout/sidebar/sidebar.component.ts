import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CashRegisterService } from '../../core/services/cash-register.service';
import { AuthService } from '../../core/services/auth.service';
import { InventoryService } from '../../core/services/inventory.service';
import { Inventory } from '../../core/api/model';
import packageJson from '../../../../package.json';
import { TenantService, TenantSettings } from '../../core/services/tenant.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { MENU_STRUCTURE } from '../../core/constants/menu-items';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  private cashRegisterService = inject(CashRegisterService);
  private authService = inject(AuthService);
  private inventoryService = inject(InventoryService);
  tenantService = inject(TenantService);
  sidebarService = inject(SidebarService);

  isCollapsed = this.sidebarService.isCollapsed;


  // Grupos del Sidebar
  menuStructure = MENU_STRUCTURE;
  
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
    return this.authService.hasPermission(component);
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
