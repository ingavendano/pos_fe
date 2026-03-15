import {
    Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerService, Customer } from '../../../core/services/customer.service';
import { DEPARTAMENTOS, MUNICIPIOS, GeographyItem } from '../../../core/constants/geography.constants';

@Component({
    selector: 'app-customers-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './customers-page.component.html',
})
export class CustomersPageComponent implements OnInit {
    private customerService = inject(CustomerService);
    private fb = inject(FormBuilder);

    customers = signal<Customer[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);
    searchQuery = signal('');
    editingCustomer = signal<Customer | null>(null);
    showForm = signal(false);

    // Geografía
    departamentos = DEPARTAMENTOS;
    availableMunicipios = signal<GeographyItem[]>([]);

    filtered = computed(() => {
        const q = this.searchQuery().toLowerCase();
        return this.customers().filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.phone ?? '').includes(q) ||
            (c.nit ?? '').includes(q)
        );
    });

    form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        phone: [''],
        email: ['', [Validators.email]],
        nit: [''],
        nrc: [''],
        giro: [''],
        documentType: [''],
        documentNumber: [''],
        departamento: [''],
        municipio: [{ value: '', disabled: true }],
        complemento: [''],
    });

    ngOnInit(): void { 
        this.load(); 
        
        // Watch departamento changes to reset and enable/disable municipio
        this.form.get('departamento')?.valueChanges.subscribe(val => {
            const list = val ? (MUNICIPIOS[val] || []) : [];
            this.availableMunicipios.set(list);

            const municipioControl = this.form.get('municipio');
            municipioControl?.setValue('', { emitEvent: false });
            if (val) {
                municipioControl?.enable({ emitEvent: false });
            } else {
                municipioControl?.disable({ emitEvent: false });
            }
        });

        // Sync initial value (especially for edit mode)
        const initialDep = this.form.get('departamento')?.value;
        if (initialDep) {
            this.availableMunicipios.set(MUNICIPIOS[initialDep] || []);
        }
    }

    load(): void {
        this.loading.set(true);
        this.customerService.getAll().subscribe({
            next: list => { this.customers.set(list); this.loading.set(false); },
            error: () => { this.error.set('Error al cargar clientes.'); this.loading.set(false); }
        });
    }

    openNew(): void {
        this.editingCustomer.set(null);
        this.form.reset();
        this.availableMunicipios.set([]);
        this.showForm.set(true);
    }

    openEdit(c: Customer): void {
        this.editingCustomer.set(c);
        this.form.patchValue({ 
            name: c.name, 
            phone: c.phone ?? '', 
            email: c.email ?? '', 
            nit: c.nit ?? '',
            nrc: c.nrc ?? '',
            giro: c.giro ?? '',
            documentType: c.documentType ?? '',
            documentNumber: c.documentNumber ?? '',
            departamento: c.departamento ?? '',
            municipio: c.municipio ?? '',
            complemento: c.complemento ?? ''
        });
        if (c.departamento) {
            this.availableMunicipios.set(MUNICIPIOS[c.departamento] || []);
            this.form.get('municipio')?.enable({ emitEvent: false });
        } else {
            this.availableMunicipios.set([]);
        }
        this.showForm.set(true);
    }

    closeForm(): void { this.showForm.set(false); this.editingCustomer.set(null); this.form.reset(); }

    save(): void {
        if (this.form.invalid) return;
        const value = this.form.value as Customer;
        const editing = this.editingCustomer();
        const req$ = editing?.id
            ? this.customerService.update(editing.id, value)
            : this.customerService.create(value);

        req$.subscribe({
            next: saved => {
                if (editing?.id) {
                    this.customers.update(list => list.map(c => c.id === saved.id ? saved : c));
                } else {
                    this.customers.update(list => [saved, ...list]);
                }
                this.closeForm();
                this.success.set(editing?.id ? 'Cliente actualizado.' : 'Cliente creado.');
                setTimeout(() => this.success.set(null), 3000);
            },
            error: () => this.error.set('Error al guardar cliente.')
        });
    }

    delete(c: Customer): void {
        if (!c.id || !confirm(`¿Eliminar a "${c.name}"?`)) return;
        this.customerService.delete(c.id).subscribe({
            next: () => this.customers.update(list => list.filter(x => x.id !== c.id)),
            error: () => this.error.set('Error al eliminar cliente.')
        });
    }
}
