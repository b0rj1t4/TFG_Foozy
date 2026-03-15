import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonBackButton,
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
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

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
    IonBackButton,
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
  ],
})
export class CreateChallengePage {
  readonly presetImages = PRESET_IMAGES;
  readonly goalPresets = GOAL_PRESETS;

  form: FormGroup;

  uploadedImage = signal<string | null>(null);
  selectedPreset = signal<string | null>(null);

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

  constructor(private fb: FormBuilder) {
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
    reader.onload = () => {
      this.uploadedImage.set(reader.result as string);
      this.selectedPreset.set(null);
    };
    reader.readAsDataURL(file);
  }

  clearUpload(event: Event) {
    event.stopPropagation();
    this.uploadedImage.set(null);
  }

  selectPreset(preset: PresetImage) {
    this.selectedPreset.set(preset.id);
  }

  setGoal(value: number) {
    this.form.get('goal')?.setValue(value);
  }

  submit() {
    if (this.form.invalid || !this.selectedImage() || this.dateRangeError())
      return;

    const payload = {
      ...this.form.value,
      image:
        this.uploadedImage() ??
        PRESET_IMAGES.find((p) => p.id === this.selectedPreset())?.url,
    };

    console.log('Challenge payload:', payload);
    // TODO: dispatch to your service / store
  }
}
