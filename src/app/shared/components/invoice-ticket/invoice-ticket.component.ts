import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderResponseDto, Branch } from '../../../core/api/model';
import { CartItem, OrderSummary } from '../../../core/models/pos.models';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../../core/services/branch.service';

@Component({
  selector: 'app-invoice-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-ticket.component.html',
  styles: [`
    .ticket-container {
      font-family: 'Courier New', Courier, monospace;
      max-width: 400px;
      margin: 0 auto;
      background: white;
      color: black;
      padding: 1rem;
      font-size: 13px;
      line-height: 1.25;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 0.75rem 0;
    }
    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .flex-between { display: flex; justify-content: space-between; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    @media print {
      .ticket-container {
        width: 80mm;
        margin: 0;
        padding: 2mm 5mm;
      }
    }
  `]
})
export class InvoiceTicketComponent {
  public tenantService = inject(TenantService);
  public authService = inject(AuthService);
  private branchService = inject(BranchService);

  @Input() order: OrderResponseDto | null = null;
  @Input() cartItems: CartItem[] = [];
  @Input() summary: OrderSummary | null = null;
  @Input() isPreCount: boolean = false;
  @Input() customer: any = null;
  @Input() paymentMethod: string = '';

  // Current Date if no order date
  public currentDate = new Date();

  // List of units for number to words conversion
  private units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  private tens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  private tensGreater = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  private hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  // Find branch details reactively
  public branchDetails = computed(() => {
    const branchId = this.order?.branchId || this.authService.currentUser()?.branchId;
    if (!branchId) return null;
    return this.branchService.branches().find(b => b.id === branchId);
  });

  // Helper to get items
  get displayItems(): any[] {
    if (this.order && this.order.items) {
      return this.order.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice,
        product: { name: item?.productName || 'Desconocido' }
      }));
    }
    return this.cartItems.map(item => ({
      ...item,
      unitPrice: item?.product?.price || 0,
      product: { name: item?.product?.name || 'Desconocido' }
    }));
  }

  // Helper to get summary
  get displaySummary() {
    const settings = this.tenantService.settings();
    if (this.order) {
      return {
        subtotal: this.order.total || 0,
        grandTotal: this.order.total || 0,
        discountAmount: this.calculateOrderDiscount(),
        taxes: [] // If order is paid, we might want to show taxes
      };
    }
    return this.summary;
  }

  private calculateOrderDiscount(): number {
    if (!this.order || !this.order.discountValue) return 0;
    if (this.order.discountType === 'FIXED') return this.order.discountValue;
    return (this.order.total || 0) * (this.order.discountValue / 100);
  }

  formatTotalInWords(): string {
    const total = this.displaySummary?.grandTotal || 0;
    const integerPart = Math.floor(total);
    const cents = Math.round((total - integerPart) * 100);
    const currencyCode = this.tenantService.getCurrencyCode() || 'USD';

    let words = this.convertNumberToWords(integerPart);
    if (integerPart === 0) words = 'cero';

    return `Son: ${words} ${cents.toString().padStart(2, '0')}/100 ${currencyCode}`.toUpperCase();
  }

  private convertNumberToWords(n: number): string {
    if (n < 10) return this.units[n];
    if (n < 20) return this.tens[n - 10];
    if (n < 100) {
      const unit = n % 10;
      const ten = Math.floor(n / 10);
      return this.tensGreater[ten] + (unit > 0 ? ' y ' + this.units[unit] : '');
    }
    if (n < 1000) {
      if (n === 100) return 'cien';
      const tenPart = n % 100;
      const hundred = Math.floor(n / 100);
      return this.hundreds[hundred] + (tenPart > 0 ? ' ' + this.convertNumberToWords(tenPart) : '');
    }
    if (n < 1000000) {
      const thousandPart = n % 1000;
      const thousands = Math.floor(n / 1000);
      let prefix = thousands === 1 ? '' : this.convertNumberToWords(thousands) + ' ';
      return prefix + 'mil' + (thousandPart > 0 ? ' ' + this.convertNumberToWords(thousandPart) : '');
    }
    return n.toString(); // Fallback for very large numbers
  }
}
