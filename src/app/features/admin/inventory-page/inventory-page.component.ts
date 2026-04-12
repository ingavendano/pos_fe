import {
    Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InventoryService, StockMovement } from '../../../core/services/inventory.service';
import { Warehouse, Inventory, Branch, Product } from '../../../core/api/model';
import { BranchService } from '../../../core/services/branch.service';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-inventory-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private branchService = inject(BranchService);
    private catalogueService = inject(CatalogueService);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);

    activeTab = signal<'bodegas' | 'stock' | 'movimientos' | 'alertas'>('stock');

    // Data Signals
    warehouses = signal<Warehouse[]>([]);
    branches = this.branchService.branches; // Use the signal from service
    products = this.catalogueService.products; // Use the signal from service

    selectedWarehouseId = signal<number | null>(null);
    inventory = signal<Inventory[]>([]);
    movements = signal<StockMovement[]>([]);
    alerts = signal<Inventory[]>([]);

    loading = signal(false);
    showWarehouseForm = signal(false);
    showAdjustmentForm = signal(false);
    showAddProductForm = signal(false);

    editingWarehouse = signal<Warehouse | null>(null);
    selectedInventoryItem = signal<Inventory | null>(null);

    warehouseForm = this.fb.group({
        name: ['', [Validators.required]],
        description: [''],
        branchId: [null as number | null, [Validators.required]],
        isDefault: [false]
    });

    addProductForm = this.fb.group({
        productId: [null as number | null, [Validators.required]],
        quantity: [0, [Validators.required, Validators.min(0)]],
        reason: ['Carga Inicial de Inventario', [Validators.required]]
    });

    adjustmentForm = this.fb.group({
        type: ['IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTAGE', [Validators.required]],
        quantity: [1, [Validators.required, Validators.min(1)]],
        reason: ['', [Validators.required]]
    });

    ngOnInit(): void {
        this.loadBasics();
        this.loadAlerts();
    }

    loadBasics(): void {
        this.loading.set(true);
        // Load warehouses
        this.inventoryService.getWarehouses().subscribe(list => {
            this.warehouses.set(list);
            if (list.length > 0 && !this.selectedWarehouseId()) {
                this.selectWarehouse(list[0].id!);
            }
            this.loading.set(false);
        });
        // Ensure branches and products are loaded in their services
        this.branchService.loadBranches();
        this.catalogueService.loadCatalogue();
    }

    loadAlerts(): void {
        this.inventoryService.getLowStockAlerts().subscribe(list => this.alerts.set(list));
    }

    selectWarehouse(id: any): void {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        this.selectedWarehouseId.set(numId);
        this.loadStock();
        this.loadMovements();
    }

    loadStock(): void {
        const id = this.selectedWarehouseId();
        if (!id) return;
        this.inventoryService.getStock(id).subscribe(list => this.inventory.set(list));
    }

    loadMovements(): void {
        const id = this.selectedWarehouseId();
        if (!id) return;
        this.inventoryService.getMovements(id).subscribe(list => this.movements.set(list));
    }

    isLowStock(item: any): boolean {
        if (!item || !item.product) return false;
        return item.quantity <= (item.product.minStock || 0);
    }

    // Warehouse Actions
    openNewWarehouse(): void {
        this.editingWarehouse.set(null);
        this.warehouseForm.reset();
        this.showWarehouseForm.set(true);
    }

    openEditWarehouse(w: Warehouse): void {
        this.editingWarehouse.set(w);
        this.warehouseForm.patchValue({
            name: w.name ?? '',
            description: w.description ?? '',
            branchId: w.branch?.id ?? null,
            isDefault: w.default || false
        });
        this.showWarehouseForm.set(true);
    }

    saveWarehouse(): void {
        if (this.warehouseForm.invalid) return;
        const formVal = this.warehouseForm.value;
        const editing = this.editingWarehouse();

        const req$ = editing?.id
            ? this.inventoryService.updateWarehouse(editing.id, formVal)
            : this.inventoryService.createWarehouse(formVal);

        req$.subscribe(() => {
            this.loadBasics();
            this.showWarehouseForm.set(false);
        });
    }

    deleteWarehouse(id: number): void {
        if (!confirm('¿Eliminar esta bodega?')) return;
        this.inventoryService.deleteWarehouse(id).subscribe(() => this.loadBasics());
    }

    // Adjustment Actions
    openAddProduct(): void {
        this.addProductForm.reset({
            productId: null,
            quantity: 0,
            reason: 'Carga Inicial de Inventario'
        });
        this.showAddProductForm.set(true);
    }

    saveInitialStock(): void {
        const warehouseId = this.selectedWarehouseId();
        if (!warehouseId || this.addProductForm.invalid) return;

        const val = this.addProductForm.value;
        this.inventoryService.adjustStock(warehouseId, {
            productId: val.productId!,
            quantity: val.quantity!,
            type: 'IN',
            reason: val.reason!,
            userId: this.authService.currentUser()?.id ?? 0
        }).subscribe(() => {
            this.loadStock();
            this.loadMovements();
            this.loadAlerts();
            this.showAddProductForm.set(false);
        });
    }

    openAdjustment(item: Inventory): void {
        this.selectedInventoryItem.set(item);
        this.adjustmentForm.reset({ type: 'IN', quantity: 1, reason: '' });
        this.showAdjustmentForm.set(true);
    }

    saveAdjustment(): void {
        const warehouseId = this.selectedWarehouseId();
        const item = this.selectedInventoryItem();
        if (!warehouseId || !item || this.adjustmentForm.invalid) return;

        const val = this.adjustmentForm.value;
        const type = val.type as 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTAGE';
        
        let req$: import('rxjs').Observable<any>;
        
        if (type === 'WASTAGE') {
            req$ = this.inventoryService.registerWastage(warehouseId, {
                productId: item.product?.id ?? 0,
                quantity: val.quantity!,
                reason: val.reason!
            });
        } else {
            req$ = this.inventoryService.adjustStock(warehouseId, {
                productId: item.product?.id ?? 0,
                quantity: val.quantity!,
                type: type,
                reason: val.reason!,
                userId: this.authService.currentUser()?.id ?? 0
            });
        }

        req$.subscribe(() => {
            this.loadStock();
            this.loadMovements();
            this.loadAlerts();
            this.showAdjustmentForm.set(false);
        });
    }
}
