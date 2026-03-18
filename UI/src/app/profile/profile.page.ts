import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { UserService } from '../services/user';
import { StepsService } from '../services/steps';

interface Friend {
  _id: string;
  id: number;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  stepsToday: number;
  sharedChallenges: number;
  isFriend: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonAvatar,
    IonChip,
    IonSearchbar,
    IonBadge,
    IonSpinner,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  // ── Service signals read directly in the template ─────────────────────────
  currentUser = this.userService.currentUser;

  // ── Local state ───────────────────────────────────────────────────────────
  users = signal<(Friend & { isFriend: boolean })[]>([]);
  editing = signal(false);
  saving = signal(false);
  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);

  // Holds editable name while in edit mode — avoids mutating the service signal
  editName = signal('');

  searchControl = new FormControl('');
  private query = signal('');

  // ── Computed ──────────────────────────────────────────────────────────────
  private filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  });

  friends = computed(() => this.filtered().filter((u) => u.isFriend));
  nonFriends = computed(() => this.filtered().filter((u) => !u.isFriend));
  friendCount = computed(() => this.users().filter((u) => u.isFriend).length);

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    public stepsService: StepsService,
  ) {}

  ngOnInit() {
    // Load own steps for the header chip
    this.stepsService.getMySteps('today').subscribe();

    // Load friends list
    this.loadFriends();

    // Search — debounced, hits API when query present, falls back to friends list when cleared
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        this.query.set(q ?? '');
        if (q && q.trim().length >= 2) {
          this.userService.searchUsers(q).subscribe((res) => {
            this.users.set(
              res.users as unknown as (Friend & { isFriend: boolean })[],
            );
          });
        } else if (!q) {
          this.loadFriends();
        }
      });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  startEdit() {
    this.editName.set(this.currentUser()?.name ?? '');
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
  }

  saveProfile() {
    this.saving.set(true);
    const file = this.avatarFile();

    const request$ = file
      ? this.userService.updateProfileWithAvatar(
          { name: this.editName() },
          file,
        )
      : this.userService.updateProfile({ name: this.editName() });

    request$.subscribe({
      next: () => {
        this.editing.set(false);
        this.avatarFile.set(null);
        this.avatarPreview.set(null);
      },
      error: (err) =>
        console.error('Update profile error', err?.error?.message),
      complete: () => this.saving.set(false),
    });
  }

  // ── Avatar ────────────────────────────────────────────────────────────────

  triggerAvatarUpload() {
    const input = document.querySelector(
      'input[type=file][accept="image/*"]',
    ) as HTMLInputElement;
    input?.click();
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarFile.set(file);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  // ── Friends ───────────────────────────────────────────────────────────────

  addFriend(user: Friend & { isFriend: boolean }) {
    this.userService.addFriend(user._id).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u._id === user._id ? { ...u, isFriend: true } : u)),
        );
      },
      error: (err) => console.error('Add friend error', err?.error?.message),
    });
  }

  removeFriend(event: Event, user: Friend & { isFriend: boolean }) {
    // Stop propagation so the row click (goToFriend) doesn't fire
    event.stopPropagation();
    this.userService.removeFriend(user._id).subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) => (u._id === user._id ? { ...u, isFriend: false } : u)),
        );
      },
      error: (err) => console.error('Remove friend error', err?.error?.message),
    });
  }

  goToFriend(user: Friend & { isFriend: boolean }) {
    this.router.navigate(['/friend', user._id]);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  logout() {
    this.authService.logout().subscribe({
      error: () => this.authService.forceLogout(),
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private loadFriends() {
    this.userService.getFriends().subscribe((res) => {
      this.users.set(
        res.friends.map(
          (f) =>
            ({ ...f, isFriend: true }) as unknown as Friend & {
              isFriend: boolean;
            },
        ),
      );
    });
  }
}
