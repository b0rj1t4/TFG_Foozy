import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

interface Friend {
  id: number;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  stepsToday: number;
  sharedChallenges: number;
  isFriend: boolean;
}

const ALL_USERS: Friend[] = [
  {
    id: 1,
    name: 'Sara Lopes',
    email: 'sara.lopes@email.com',
    avatarInitials: 'SL',
    avatarColor: 'primary',
    stepsToday: 8420,
    sharedChallenges: 3,
    isFriend: true,
  },
  {
    id: 2,
    name: 'Miguel Ferreira',
    email: 'miguel.f@email.com',
    avatarInitials: 'MF',
    avatarColor: 'success',
    stepsToday: 12300,
    sharedChallenges: 2,
    isFriend: true,
  },
  {
    id: 3,
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    avatarInitials: 'AC',
    avatarColor: 'tertiary',
    stepsToday: 5600,
    sharedChallenges: 1,
    isFriend: true,
  },
  {
    id: 4,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    avatarInitials: 'JS',
    avatarColor: 'warning',
    stepsToday: 9800,
    sharedChallenges: 2,
    isFriend: true,
  },
  {
    id: 5,
    name: 'Beatriz Matos',
    email: 'bea.matos@email.com',
    avatarInitials: 'BM',
    avatarColor: 'danger',
    stepsToday: 7100,
    sharedChallenges: 0,
    isFriend: true,
  },
  {
    id: 6,
    name: 'Rui Barbosa',
    email: 'rui.barbosa@email.com',
    avatarInitials: 'RB',
    avatarColor: 'primary',
    stepsToday: 3200,
    sharedChallenges: 0,
    isFriend: false,
  },
  {
    id: 7,
    name: 'Inês Rodrigues',
    email: 'ines.r@email.com',
    avatarInitials: 'IR',
    avatarColor: 'success',
    stepsToday: 15400,
    sharedChallenges: 0,
    isFriend: false,
  },
  {
    id: 8,
    name: 'Carlos Neves',
    email: 'carlos.neves@email.com',
    avatarInitials: 'CN',
    avatarColor: 'tertiary',
    stepsToday: 6700,
    sharedChallenges: 0,
    isFriend: false,
  },
  {
    id: 9,
    name: 'Mariana Sousa',
    email: 'mariana.s@email.com',
    avatarInitials: 'MS',
    avatarColor: 'warning',
    stepsToday: 4400,
    sharedChallenges: 0,
    isFriend: false,
  },
  {
    id: 10,
    name: 'Tiago Alves',
    email: 'tiago.alves@email.com',
    avatarInitials: 'TA',
    avatarColor: 'danger',
    stepsToday: 11200,
    sharedChallenges: 0,
    isFriend: false,
  },
];

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
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  currentUser = {
    name: 'Alex Ramos',
    email: 'alex.ramos@email.com',
    avatarInitials: 'AR',
    avatarColor: 'primary',
    stepsToday: 5820,
  };

  users = signal<Friend[]>(ALL_USERS);
  editing = signal(false);
  editingAvatar = signal(false);

  searchControl = new FormControl('');

  private query = signal('');

  constructor() {
    // Bridge FormControl value → signal so computed() can track it
    this.searchControl.valueChanges.subscribe((v) => this.query.set(v ?? ''));
  }

  private filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });

  friends = computed(() => this.filtered().filter((u) => u.isFriend));
  nonFriends = computed(() => this.filtered().filter((u) => !u.isFriend));
  friendCount = computed(() => this.users().filter((u) => u.isFriend).length);

  toggleEdit() {
    this.editing.update((v) => !v);
    this.editingAvatar.set(!this.editingAvatar());
  }

  saveProfile() {
    this.editing.set(false);
    this.editingAvatar.set(false);
    // TODO: persist to your service
  }

  addFriend(user: Friend) {
    this.users.update((list) =>
      list.map((u) => (u.id === user.id ? { ...u, isFriend: true } : u)),
    );
  }

  removeFriend(user: Friend) {
    this.users.update((list) =>
      list.map((u) => (u.id === user.id ? { ...u, isFriend: false } : u)),
    );
  }

  triggerAvatarUpload() {
    const input = document.querySelector(
      'input[type=file][accept="image/*"]',
    ) as HTMLInputElement;
    input?.click();
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    // TODO: upload file and update avatar URL
    console.log('Avatar file selected:', file.name);
  }
}
