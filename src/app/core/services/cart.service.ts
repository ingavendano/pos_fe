import { Injectable, computed, signal, inject } from '@angular/core';
import { CartItem, OrderSummary } from '../models/pos.models';
import { Product } from '../api/model';
import { TaxService } from './tax.service';
import { AuthService } from './auth.service';
import { TableService } from './table.service';
import { CatalogueService } from './catalogue.service';
import { Observable, tap, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { effect } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Customer } from './customer.service';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private taxService = inject(TaxService);
    private authService = inject(AuthService);
    private tableService = inject(TableService);
    private catalogueService = inject(CatalogueService);

    // Core state: list of items in the current order ticket
    items = signal<CartItem[]>([]);
    activeOrderId = signal<number | null>(null);
    activeOrderConsecutiveNumber = signal<number | null>(null);

    // Discount state
    discountType = signal<'PERCENT' | 'FIXED' | 'NONE' | null>(null); // Updated to include 'NONE'
    discountValue = signal<number>(0);

    /** Select a customer for the current order */
    selectedCustomer = signal<Customer | null>(null);

    // Derived state (computed) for subtotal
    subtotal = computed(() => {
        return this.items().reduce((total, item) => total + item.quantity * (item.product.price ?? 0), 0);
    });

    constructor() {
        // Automatically sync cart when a table is selected
        effect(() => {
            const table = this.tableService.activeTable();
            if (table) {
                // When selecting a new table, always start with an empty cart
                this.items.set([]);
                this.activeOrderId.set(null);
                this.selectedCustomer.set(null); // Clear customer on table change

                if (table.status === 'OCCUPIED') {
                    // Fetch existing order for this table
                    this.tableService.getActiveOrder(table.id!).subscribe({
                        next: (order) => {
                            if (order) {
                                this.activeOrderId.set(order.id);
                                this.activeOrderConsecutiveNumber.set(order.consecutiveNumber);
                                // Map backend OrderItem to frontend CartItem
                                const loadedItems: CartItem[] = (order.items || []).map((i: any) => ({
                                    product: {
                                        id: i?.productId,
                                        name: i?.productName || 'Desconocido',
                                        price: i?.unitPrice || 0
                                    } as Product,
                                    quantity: i?.quantity || 1,
                                    savedQuantity: i?.quantity || 1,
                                    subtotal: i?.subtotal || 0,
                                    notes: i?.notes
                                }));
                                this.items.set(loadedItems);
                                // Restore discount if order has one
                                if (order.discountType) {
                                    this.discountType.set(order.discountType);
                                    this.discountValue.set(order.discountValue ?? 0);
                                }
                                // Restore customer if order has one
                                if (order.customer) {
                                    this.selectedCustomer.set(order.customer);
                                }
                            }
                        },
                        error: (err) => {
                            console.error('Error fetching active order for table', err);
                        }
                    });
                }
            } else {
                this.items.set([]);
                this.activeOrderId.set(null);
                this.activeOrderConsecutiveNumber.set(null);
                this.selectedCustomer.set(null); // Clear customer when no table is selected
            }
        });
    }

    // Derived state (computed) for dynamic taxes and grand total
    orderSummary = computed<OrderSummary>(() => {
        const currentSubtotal = this.subtotal();
        const taxes = this.taxService.getActiveTaxes().map(tax => {
            // Calculate each tax
            const calculatedAmount = (currentSubtotal * (tax.percentage ?? 0)) / 100;
            return { tax, calculatedAmount };
        });

        const positiveTaxes = taxes
            .filter(t => t.tax.type === 'STANDARD' || t.tax.type === 'TIP' || !t.tax.type)
            .reduce((sum, t) => sum + t.calculatedAmount, 0);

        const retentions = taxes
            .filter(t => t.tax.type === 'RETENTION')
            .reduce((sum, t) => sum + t.calculatedAmount, 0);

        // Compute discount
        const dType = this.discountType();
        const dValue = this.discountValue();
        let discountAmount = 0;
        if (dType && dType !== 'NONE' && dValue > 0) {
            if (dType === 'PERCENT') {
                discountAmount = Math.min(currentSubtotal * dValue / 100, currentSubtotal);
            } else {
                discountAmount = Math.min(dValue, currentSubtotal);
            }
        }

        const grandTotal = currentSubtotal + positiveTaxes - retentions - discountAmount;

        return {
            subtotal: currentSubtotal,
            taxes,
            discountAmount,
            grandTotal
        };
    });


    addItem(product: Product, quantity: number = 1, notes?: string) {
        this.items.update(currentItems => {
            const existingItemIndex = currentItems.findIndex(i => i.product.id === product.id && i.notes === notes);

            if (existingItemIndex > -1) {
                const updatedItems = [...currentItems];
                const item = updatedItems[existingItemIndex];

                const maxAllowed = (product.quantity ?? 0) + (item.savedQuantity || 0);
                const newQty = Math.min(item.quantity + quantity, maxAllowed);

                updatedItems[existingItemIndex] = {
                    ...item,
                    quantity: newQty,
                    subtotal: newQty * (item.product.price ?? 0)
                };
                return updatedItems;
            } else {
                const maxAllowed = (product.quantity ?? 0);
                const newQty = Math.min(quantity, maxAllowed);

                if (newQty <= 0) return currentItems;

                return [...currentItems, {
                    product,
                    quantity: newQty,
                    subtotal: quantity * (product.price ?? 0),
                    notes
                }];
            }
        });
    }

    updateQuantity(index: number, newQuantity: number) {
        if (newQuantity <= 0) {
            this.removeItem(index);
            return;
        }

        this.items.update(currentItems => {
            const updatedItems = [...currentItems];
            const item = updatedItems[index];

            const maxAllowed = (item.product.quantity ?? 0) + (item.savedQuantity || 0);
            const cappedQuantity = Math.min(newQuantity, maxAllowed);

            updatedItems[index] = {
                ...item,
                quantity: cappedQuantity,
                subtotal: cappedQuantity * (item.product.price ?? 0)
            };
            return updatedItems;
        });
    }

    removeItem(index: number) {
        this.items.update(currentItems => currentItems.filter((_, i) => i !== index));
    }

    clearCart() {
        this.items.set([]);
        this.discountType.set('NONE');
        this.discountValue.set(0);
        this.selectedCustomer.set(null);
    }

    getOrderPayload() {
        const activeTable = this.tableService.activeTable();
        const currentUser = this.authService.currentUser();
        const summary = this.orderSummary();

        if (!activeTable || !currentUser || !currentUser.branchId || !currentUser.id) {
            throw new Error("Faltan datos requeridos (mesa, usuario o sucursal) para procesar la orden.");
        }

        return {
            total: summary.grandTotal,
            discountType: this.discountType() !== 'NONE' ? this.discountType() : null,
            discountValue: this.discountValue() > 0 ? this.discountValue() : null,
            customerId: this.selectedCustomer() ? this.selectedCustomer()?.id as number : null,
            items: this.items().map((item: any) => ({
                productId: item.product.id as number,
                quantity: item.quantity as number,
                unitPrice: item.product.price as number,
                subtotal: item.subtotal as number,
                notes: item.notes as string | undefined
            }))
        };
    }
    
    postCheckoutCleanup() {
        this.clearCart();
        this.tableService.clearSelection();
        this.tableService.loadTables();
        this.catalogueService.loadCatalogue();
    }
}
