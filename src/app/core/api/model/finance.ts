export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'SALARY' | 'MAINTENANCE' | 'SUPPLIES' | 'MARKETING' | 'OTHER';

export interface Expense {
    id?: number;
    description: string;
    amount: number;
    category: ExpenseCategory;
    expenseDate: string;
}

export interface ProfitabilityReport {
    totalRevenue: number;
    totalCogs: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMarginPercentage: number;
    expensesByCategory: Record<string, number>;
}
