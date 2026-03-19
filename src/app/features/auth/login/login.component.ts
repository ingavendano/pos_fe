import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styles: [`
      .login-input {
        border-color: #d1d5db;
      }
      .login-input:focus {
        box-shadow: 0 0 0 2px var(--color-primary-600);
        border-color: var(--color-primary-600);
      }
    `]
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    authService = inject(AuthService);
    private router = inject(Router);

    tenantInfo = this.authService.tenantInfo;
    domainRegistered = this.authService.domainRegistered;

    /** Subdominio a mostrar: viene del tenant o fallback al host actual. */
    subdomain = computed(() => {
        const info = this.authService.tenantInfo();
        if (info?.domain) return info.domain;
        if (typeof window !== 'undefined') return window.location.hostname;
        return '';
    });

    loginForm = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required]
    });

    isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);

    onSubmit() {
        if (this.loginForm.invalid) return;

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        const username = this.loginForm.value.username as string;
        const password = this.loginForm.value.password as string;

        this.authService.login(username, password).subscribe({
            next: () => {
                this.router.navigate(['/pos']);
            },
            error: (err: any) => {
                this.isSubmitting.set(false);
                this.errorMessage.set('Usuario o contraseña incorrectos.');
                console.error('Login error', err);
            }
        });
    }
}
