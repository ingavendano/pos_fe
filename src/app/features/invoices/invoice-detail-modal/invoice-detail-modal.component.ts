import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderResponseDto, Branch } from '../../../core/api/model';
import { TenantService } from '../../../core/services/tenant.service';
import { TicketPrintService } from '../../../core/services/ticket-print.service';
import { BranchService } from '../../../core/services/branch.service';
import { InvoiceTicketComponent } from '../../../shared/components/invoice-ticket/invoice-ticket.component';

@Component({
  selector: 'app-invoice-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, InvoiceTicketComponent],
  templateUrl: './invoice-detail-modal.component.html',
  styleUrl: './invoice-detail-modal.component.css'
})
export class InvoiceDetailModalComponent {
  tenantService = inject(TenantService);
  private ticketPrint = inject(TicketPrintService);
  private branchService = inject(BranchService);

  @Input({ required: true }) order!: OrderResponseDto;
  @Output() close = new EventEmitter<void>();

  printInvoice(): void {
    this.ticketPrint.printInvoice(this.order, this.order.invoice?.paymentMethod ?? 'CASH');
  }

  printPreCount(): void {
    this.ticketPrint.printPreCount(this.order);
  }
}
