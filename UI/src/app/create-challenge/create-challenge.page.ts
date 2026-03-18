import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ChallengeService } from '../services/challenges';
import { NavigationService } from '../services/navigation.service';

interface PresetImage {
  id: string;
  label: string;
  url: string;
}

const PRESET_IMAGES: PresetImage[] = [
  {
    id: 'city',
    label: 'City Run',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80',
  },
  {
    id: 'trail',
    label: 'Trail',
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80',
  },
  {
    id: 'team',
    label: 'Team',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80',
  },
  {
    id: 'beach',
    label: 'Beach Walk',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  },
];

const GOAL_PRESETS = [5000, 10000, 50000, 100000, 500000];

@Component({
  selector: 'app-create-challenge',
  templateUrl: 'create-challenge.page.html',
  styleUrls: ['create-challenge.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonDatetimeButton,
    IonDatetime,
    IonModal,
    IonIcon,
    IonChip,
    IonNote,
    IonSpinner,
  ],
})
export class CreateChallengePage {
  readonly presetImages = PRESET_IMAGES;
  readonly goalPresets = GOAL_PRESETS;

  form: FormGroup;
  submitting = signal(false);
  uploadedImage = signal<string | null>(null);
  uploadFile = signal<File | null>(null);
  selectedPreset = signal<string | null>(null);

  // Derived — is this an edit or a create?
  isEditMode = computed(() => !!this.route.snapshot.paramMap.get('id'));

  selectedImage = computed(() => this.uploadedImage() ?? this.selectedPreset());

  previewBg = computed(() => {
    const uploaded = this.uploadedImage();
    if (uploaded) return `url(${uploaded})`;
    const presetId = this.selectedPreset();
    if (presetId) {
      const preset = PRESET_IMAGES.find((p) => p.id === presetId);
      if (preset) return `url(${preset.url})`;
    }
    return 'none';
  });

  dateRangeError = computed(() => {
    const start = this.form?.get('startDate')?.value;
    const end = this.form?.get('endDate')?.value;
    if (!start || !end) return false;
    return new Date(end) <= new Date(start);
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private challengeService: ChallengeService,
    public nav: NavigationService,
  ) {
    const today = new Date().toISOString();
    const nextMonth = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      goal: [10000, [Validators.required, Validators.min(1)]],
      startDate: [today, Validators.required],
      endDate: [nextMonth, Validators.required],
    });
  }

  ngOnInit() {
    if (this.isEditMode()) {
      this.prefillFromService();
    }
  }

  // ── Edit mode — prefill form from the cached challenge ────────────────────

  private prefillFromService() {
    const c = this.challengeService.activeChallenge();
    if (!c) return;

    this.form.patchValue({
      title: c.title,
      description: c.description ?? '',
      goal: c.targetSteps,
      startDate: c.startDate,
      endDate: c.endDate,
    });

    // If the challenge has a cover URL that matches a preset, select it
    const matchedPreset = PRESET_IMAGES.find((p) => p.url === c.coverUrl);
    if (matchedPreset) {
      this.selectedPreset.set(matchedPreset.id);
    } else if (c.coverUrl) {
      // External / uploaded URL — show it in the preview without a file
      this.uploadedImage.set(c.coverUrl);
    }
  }

  // ── Image ─────────────────────────────────────────────────────────────────

  triggerUpload() {
    const input = document.querySelector(
      'input[type=file]',
    ) as HTMLInputElement;
    input?.click();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadFile.set(file);
    this.selectedPreset.set(null);
    const reader = new FileReader();
    reader.onload = () => this.uploadedImage.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearUpload(event: Event) {
    event.stopPropagation();
    this.uploadedImage.set(null);
    this.uploadFile.set(null);
  }

  selectPreset(preset: PresetImage) {
    this.selectedPreset.set(preset.id);
    this.uploadedImage.set(null);
    this.uploadFile.set(null);
  }

  // ── Goal ──────────────────────────────────────────────────────────────────

  setGoal(value: number) {
    this.form.get('goal')?.setValue(value);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit() {
    if (this.form.invalid || this.dateRangeError() || this.submitting()) return;
    if (!this.isEditMode() && !this.selectedImage()) return;

    this.submitting.set(true);
    const { title, description, goal, startDate, endDate } = this.form.value;
    const file = this.uploadFile();

    if (this.isEditMode()) {
      this.handleUpdate(title, description, goal, endDate, file);
    } else {
      this.handleCreate(title, description, goal, startDate, endDate, file);
    }
  }

  private handleCreate(
    title: string,
    description: string,
    goal: number,
    startDate: string,
    endDate: string,
    file: File | null,
  ) {
    const coverUrl = PRESET_IMAGES.find(
      (p) => p.id === this.selectedPreset(),
    )?.url;
    const payload = {
      title,
      description,
      targetSteps: goal,
      startDate,
      endDate,
      coverUrl,
    };

    const request$ = file
      ? this.challengeService.createChallengeWithCover(payload, file)
      : this.challengeService.createChallenge(payload);

    request$.subscribe({
      next: () =>
        this.router.navigateByUrl('/tabs/challenges', { replaceUrl: true }),
      error: (err) => console.error('Create error', err?.error?.message),
      complete: () => this.submitting.set(false),
    });
  }

  private handleUpdate(
    title: string,
    description: string,
    goal: number,
    endDate: string,
    file: File | null,
  ) {
    const id = this.route.snapshot.paramMap.get('id')!;

    // If a new file was selected, upload it first via updateProfileWithAvatar equivalent
    // For now we pass the payload — extend with file upload when your backend supports it
    this.challengeService
      .updateChallenge(id, {
        title,
        description,
        targetSteps: goal,
        endDate,
      })
      .subscribe({
        next: () => this.nav.back(),
        error: (err) => console.error('Update error', err?.error?.message),
        complete: () => this.submitting.set(false),
      });
  }
}
