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
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

type PageState = 'form' | 'sent';

@Component({
  selector: 'app-forgot-pass',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonList,
    IonItem,
    IonInput,
    IonNote,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  form: FormGroup;
  loading = signal(false);
  serverError = signal<string | null>(null);
  state = signal<PageState>('form');
  submittedEmail = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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

    try {
      const { email } = this.form.value;

      // TODO: replace with AuthService.forgotPassword(email)
      console.log('Forgot password for:', email);

      this.submittedEmail.set(email);
      this.state.set('sent');
    } catch (err: any) {
      this.serverError.set(
        err?.error?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  tryAgain() {
    this.form.reset();
    this.serverError.set(null);
    this.state.set('form');
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
