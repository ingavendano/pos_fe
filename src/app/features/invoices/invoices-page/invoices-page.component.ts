import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceDetailModalComponent } from '../invoice-detail-modal/invoice-detail-modal.component';
import { InvoiceService } from '../../../core/services/invoice.service';
import { TenantService } from '../../../core/services/tenant.service';
import { OrderResponseDto } from '../../../core/api/model';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceDetailModalComponent, CurrencyPipe, DatePipe],
  templateUrl: './invoices-page.component.html'
})
export default class InvoicesPageComponent implements OnInit {
  invoiceService = inject(InvoiceService);
  tenantService = inject(TenantService);

  searchTerm = signal('');
  selectedOrder = signal<OrderResponseDto | null>(null);

  filteredInvoices = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const invoices = this.invoiceService.invoices() || [];

    if (!term) return invoices;

    return invoices.filter(order =>
      (order.id?.toString() || '').includes(term) ||
      (order.waiterName || '').toLowerCase().includes(term) ||
      (order.tableNumber || '').toString().includes(term) ||
      (order.status || '').toLowerCase().includes(term)
    );
  });

  currentTotalSum = computed(() => {
    return this.filteredInvoices().reduce((sum, order) => sum + (order.total || 0), 0);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.invoiceService.loadInvoices().subscribe();
  }

  viewInvoice(order: OrderResponseDto) {
    this.selectedOrder.set(order);
  }
}
