import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { LoginRequest, RegisterRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  mode    = signal<'login' | 'register'>('login');
  loading = signal(false);
  error   = signal<string | null>(null);

  loginForm: LoginRequest    = { username: '', password: '' };
  registerForm: RegisterRequest = { username: '', email: '', password: '' };

  // ── Actions ────────────────────────────────────────────────────────────────
  submit(): void {
    this.error.set(null);
    this.loading.set(true);

    const obs$ = this.mode() === 'login'
      ? this.auth.login(this.loginForm)
      : this.auth.register(this.registerForm);

    obs$.subscribe({
      next:  () => this.router.navigate(['/']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'An error occurred. Please try again.');
        this.loading.set(false);
      }
    });
  }

  switchMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.error.set(null);
  }
}
