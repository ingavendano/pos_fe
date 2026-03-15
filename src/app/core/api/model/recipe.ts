import { Product } from './product';
import { Tenant } from './tenant';

export interface ProductRecipe {
    id?: number;
    product?: Product;
    ingredient?: Product;
    quantity?: number;
    tenant?: Tenant;
}
