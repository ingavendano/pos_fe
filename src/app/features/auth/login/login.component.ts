import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    tenantInfo = this.authService.tenantInfo;

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
