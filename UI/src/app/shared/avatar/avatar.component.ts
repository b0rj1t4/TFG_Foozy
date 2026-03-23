import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';

export const AVATAR_COLORS = [
  'primary',
  'success',
  'tertiary',
  'warning',
  'danger',
] as AvatarColor[];

export type AvatarColor =
  | 'primary'
  | 'success'
  | 'tertiary'
  | 'warning'
  | 'danger';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner],
})
export class AvatarComponent {
  readonly serverUrl = environment.serverUrl;
  /** URL of an uploaded photo — takes priority over initials */
  @Input() avatarUrl: string | null = null;

  @Input() initials = '';

  /** Background/text colour when showing initials */
  @Input() avatarColor: AvatarColor = 'primary';

  /** Visual size of the avatar */
  @Input() size: AvatarSize = 'md';

  /** Shows the camera overlay and file input */
  @Input() editable = false;

  /** Shows a spinner inside the overlay while uploading */
  @Input() uploading = false;

  /** Emits the selected File when the user picks one */
  @Output() fileSelected = new EventEmitter<File>();

  /** Emits a local base64 preview URL immediately after selection */
  @Output() previewReady = new EventEmitter<string>();

  // Local preview set immediately after the user picks a file
  preview = signal<string | null>(null);

  triggerUpload() {
    const input = document.querySelector(
      'app-avatar input[type=file]',
    ) as HTMLInputElement;
    input?.click();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.preview.set(dataUrl);
      this.previewReady.emit(dataUrl);
    };
    reader.readAsDataURL(file);

    this.fileSelected.emit(file);
  }

  // If the img fails to load (broken URL), fall back to initials
  onImgError() {
    this.preview.set(null);
  }

  /** Clears the local preview (call from parent after upload fails) */
  clearPreview() {
    this.preview.set(null);
  }
}
