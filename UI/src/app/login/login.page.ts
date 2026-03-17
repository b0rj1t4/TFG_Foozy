import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonInput,
    IonNote,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  form: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  serverError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  touched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.router.navigateByUrl('/tabs/activity', { replaceUrl: true });
      },
      error: (err) => {
        this.serverError.set(
          err?.error?.message ?? 'Invalid email or password',
        );
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  forgotPassword() {
    this.router.navigateByUrl('/forgot-password');
  }

  goToSignup() {
    this.router.navigateByUrl('/signup');
  }
}
