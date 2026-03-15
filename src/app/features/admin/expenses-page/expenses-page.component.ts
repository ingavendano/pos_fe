import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { Expense, ExpenseCategory } from '../../../core/api/model/finance';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, ReactiveFormsModule],
  templateUrl: './expenses-page.component.html'
})
export class ExpensesPageComponent implements OnInit {
  private financeService = inject(FinanceService);
  private fb = inject(FormBuilder);

  expenses = signal<Expense[]>([]);
  isLoading = signal(false);
  isModalOpen = signal(false);

  totalExpensesAmount = computed(() => 
    this.expenses().reduce((sum, e) => sum + (e.amount || 0), 0)
  );

  categories: ExpenseCategory[] = ['RENT', 'UTILITIES', 'SALARY', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'OTHER'];

  expenseForm = this.fb.group({
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    category: ['OTHER' as ExpenseCategory, Validators.required],
    expenseDate: [new Date().toISOString().split('T')[0], Validators.required]
  });

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.isLoading.set(true);
    this.financeService.getExpenses().subscribe({
      next: (data: Expense[]) => {
        this.expenses.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openAddModal() {
    this.expenseForm.reset({
      description: '',
      amount: 0,
      category: 'OTHER',
      expenseDate: new Date().toISOString().split('T')[0]
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveExpense() {
    if (this.expenseForm.invalid) return;

    const expense = this.expenseForm.value as Expense;
    this.financeService.createExpense(expense).subscribe({
      next: () => {
        this.loadExpenses();
        this.closeModal();
      }
    });
  }

  deleteExpense(id: number) {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      this.financeService.deleteExpense(id).subscribe(() => {
        this.loadExpenses();
      });
    }
  }

  getCategoryLabel(category: ExpenseCategory): string {
    const labels: Record<string, string> = {
      RENT: 'Renta',
      UTILITIES: 'Servicios (Luz/Agua)',
      SALARY: 'Sueldos',
      MAINTENANCE: 'Mantenimiento',
      SUPPLIES: 'Insumos',
      MARKETING: 'Publicidad',
      OTHER: 'Otros'
    };
    return labels[category] || category;
  }
}
