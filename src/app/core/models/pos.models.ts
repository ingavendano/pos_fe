import { Product, Tax } from '../api/model';

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  savedQuantity?: number;
  subtotal: number;
  notes?: string;
}

export interface OrderSummary {
  subtotal: number;
  taxes: { tax: Tax; calculatedAmount: number }[];
  discountAmount: number;
  grandTotal: number;
}
