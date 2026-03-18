import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  AbstractControl,
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
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import {
  AVATAR_COLORS,
  AvatarColor,
  AvatarComponent,
} from '../shared/avatar/avatar.component';

function confirmPasswordValidator(control: AbstractControl) {
  const password = control.parent?.get('password')?.value;
  return control.value === password ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonInput,
    IonNote,
    IonIcon,
    IonSpinner,
    AvatarComponent,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  readonly avatarColors = AVATAR_COLORS;

  form: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  showConfirm = signal(false);
  avatarFile = signal<File | null>(null);

  avatarPreview = signal<string | null>(null);
  selectedColor = signal<AvatarColor>('primary');
  serverError = signal<string | null>(null);

  // Live initials from the name field
  initials = computed(() => {
    const name: string = this.form?.get('name')?.value ?? '';
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private userService: UserService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, confirmPasswordValidator]],
    });

    // Re-validate confirmPassword whenever password changes
    this.form.get('password')!.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')!.updateValueAndValidity();
    });
  }

  touched(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  triggerUpload() {
    const input = document.querySelector(
      'input[type=file]',
    ) as HTMLInputElement;
    input?.click();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearAvatar() {
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    const { name, email, password } = this.form.value;

    this.auth
      .register({
        name,
        email,
        password,
        avatarColor: this.selectedColor(),
      })
      .subscribe({
        next: () => {
          // If there's an avatar file, upload it right after registration
          const file = (
            document.querySelector('input[type=file]') as HTMLInputElement
          )?.files?.[0];
          if (file) {
            this.userService.updateProfileWithAvatar({}, file).subscribe();
          }
          this.router.navigateByUrl('/tabs/activity', { replaceUrl: true });
        },
        error: (err) => {
          this.serverError.set(
            err?.error?.message ?? 'Something went wrong. Please try again.',
          );

          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  onAvatarFile(file: File) {
    this.avatarFile.set(file);
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
