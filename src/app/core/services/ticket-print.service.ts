import { Injectable, ApplicationRef, createComponent, EnvironmentInjector, inject } from '@angular/core';
import { OrderResponseDto } from '../api/model';
import { InvoiceTicketComponent } from '../../shared/components/invoice-ticket/invoice-ticket.component';

@Injectable({ providedIn: 'root' })
export class TicketPrintService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  // ── Public API ────────────────────────────────────────────

  printPreCount(order: OrderResponseDto): void {
    this.printComponent(order, true, 'CASH');
  }

  printInvoice(order: OrderResponseDto, paymentMethod: string): void {
    this.printComponent(order, false, paymentMethod);
  }

  // ── Print Engine ──────────────────────────────────────────

  private printComponent(order: OrderResponseDto, isPreCount: boolean, paymentMethod: string) {
    // 1. Ensure the print section exists
    let printSection = document.getElementById('print-section');
    if (!printSection) {
      printSection = document.createElement('div');
      printSection.id = 'print-section';
      document.body.appendChild(printSection);
    }

    // Clear previous instances
    printSection.innerHTML = '';

    // 2. Create the component dynamically
    const componentRef = createComponent(InvoiceTicketComponent, {
      environmentInjector: this.injector
    });

    // 3. Bind inputs
    componentRef.setInput('order', order);
    componentRef.setInput('isPreCount', isPreCount);
    componentRef.setInput('paymentMethod', paymentMethod);
    componentRef.setInput('customer', order.customer);

    // 4. Attach to Angular's application tree so lifecycle hooks & ChangeDetection run
    this.appRef.attachView(componentRef.hostView);

    // 5. Append DOM element to our print section
    printSection.appendChild(componentRef.location.nativeElement);

    // Trigger change detection synchronously
    componentRef.changeDetectorRef.detectChanges();

    // 6. Print (delay briefly to allow CSS/images to render if any)
    setTimeout(() => {
      window.print();

      // Cleanup
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      printSection!.innerHTML = '';
    }, 100);
  }
}

