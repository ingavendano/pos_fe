import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { TenantService } from '../../../core/services/tenant.service';
import { TableService } from '../../../core/services/table.service';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService, Customer } from '../../../core/services/customer.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { TicketPrintService } from '../../../core/services/ticket-print.service';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/api/model';

@Component({
  selector: 'app-order-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-ticket.component.html',
  styleUrl: './order-ticket.component.css'
})
export class OrderTicketComponent {
  cartService = inject(CartService);
  tenantService = inject(TenantService);
  tableService = inject(TableService);
  authService = inject(AuthService);
  customerService = inject(CustomerService);
  ticketPrint = inject(TicketPrintService);
  branchService = inject(BranchService);

  // Customer Selection Logic
  showCustomerSelector = signal(false);
  customerSearchText = signal('');
  customersResult = signal<Customer[]>([]);
  private searchSubject = new Subject<string>();


  isProcessing = signal(false);
  showSuccess = signal(false);
  errorMessage = signal<string | null>(null);

  isPaidReceipt = signal(false);
  currentDate = new Date();

  /** Payment method selected by the cashier before charging */
  paymentMethod = signal<'CASH' | 'CARD' | 'TRANSFER'>('CASH');

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.customerService.getAll(term).subscribe(results => {
        this.customersResult.set(results);
      });
    });
  }

  onSearchCustomer(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.customerSearchText.set(term);
    this.searchSubject.next(term);
  }

  selectCustomer(customer: Customer) {
    this.cartService.selectedCustomer.set(customer);
    this.showCustomerSelector.set(false);
    this.customerSearchText.set('');
    this.customersResult.set([]);
  }

  removeCustomer() {
    this.cartService.selectedCustomer.set(null);
  }


  // processDoc handles Pre-cuenta and Paid invoice printing
  processDoc(isFinalPayment: boolean) {
    this.isPaidReceipt.set(isFinalPayment);
    this.currentDate = new Date();

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    // Disparar checkout normal al backend para guardar o cobrar
    this.cartService.checkout(isFinalPayment, this.paymentMethod()).subscribe({
      next: (order) => {
        this.isProcessing.set(false);

        if (isFinalPayment) {
          this.ticketPrint.printInvoice(order, this.paymentMethod() || 'CASH');
        } else {
          this.ticketPrint.printPreCount(order);
        }
      },
      error: (err) => {
        console.error('Print Error:', err);
        this.isProcessing.set(false);
        const errorMsg = err.error?.message || err.message || 'Error al conectar con el servidor.';
        this.errorMessage.set(errorMsg);
      }
    });
  }

  // processOrder handle normal saving without printing
  processOrder(isPaid: boolean) {
    this.isProcessing.set(true);
    this.errorMessage.set(null);

    this.cartService.checkout(isPaid, this.paymentMethod()).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.showSuccess.set(true);
        setTimeout(() => {
          this.showSuccess.set(false);
        }, 3000);
      },
      error: (err) => {
        console.error('Checkout error:', err);
        this.isProcessing.set(false);
        const errorMsg = err.error?.message || err.message || 'Error al procesar la orden. Verifique la conexión.';
        this.errorMessage.set(errorMsg);
      }
    });
  }
}


