import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonProgressBar,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  flagOutline,
  footstepsOutline,
  peopleOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

// ── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  id: number;
  name: string;
  avatarInitials: string;
  avatarColor: string;
  steps: number;
  isMe: boolean;
  isFriend: boolean;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  targetSteps: number;
  startDate: string;
  endDate: string;
  participants: Participant[];
}

// ── Mock data ────────────────────────────────────────────────────────────────

const CHALLENGE: Challenge = {
  id: 3,
  title: 'March Madness',
  description:
    'Push your limits this March. Hit 200,000 steps before the month is over!',
  coverUrl:
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
  targetSteps: 200000,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  participants: [
    {
      id: 7,
      name: 'Inês Rodrigues',
      avatarInitials: 'IR',
      avatarColor: 'success',
      steps: 187400,
      isMe: false,
      isFriend: false,
    },
    {
      id: 2,
      name: 'Miguel Ferreira',
      avatarInitials: 'MF',
      avatarColor: 'success',
      steps: 182000,
      isMe: false,
      isFriend: true,
    },
    {
      id: 10,
      name: 'Tiago Alves',
      avatarInitials: 'TA',
      avatarColor: 'danger',
      steps: 165300,
      isMe: false,
      isFriend: false,
    },
    {
      id: 4,
      name: 'João Silva',
      avatarInitials: 'JS',
      avatarColor: 'warning',
      steps: 158900,
      isMe: false,
      isFriend: true,
    },
    {
      id: 8,
      name: 'Carlos Neves',
      avatarInitials: 'CN',
      avatarColor: 'tertiary',
      steps: 152100,
      isMe: false,
      isFriend: false,
    },
    {
      id: 9,
      name: 'Mariana Sousa',
      avatarInitials: 'MS',
      avatarColor: 'warning',
      steps: 148700,
      isMe: false,
      isFriend: false,
    },
    {
      id: 3,
      name: 'Ana Costa',
      avatarInitials: 'AC',
      avatarColor: 'tertiary',
      steps: 141200,
      isMe: false,
      isFriend: true,
    },
    {
      id: 6,
      name: 'Rui Barbosa',
      avatarInitials: 'RB',
      avatarColor: 'primary',
      steps: 138500,
      isMe: false,
      isFriend: false,
    },
    {
      id: 1,
      name: 'Sara Lopes',
      avatarInitials: 'SL',
      avatarColor: 'primary',
      steps: 136000,
      isMe: false,
      isFriend: true,
    },
    {
      id: 0,
      name: 'Alex Ramos',
      avatarInitials: 'AR',
      avatarColor: 'primary',
      steps: 134500,
      isMe: true,
      isFriend: false,
    },
    {
      id: 5,
      name: 'Beatriz Matos',
      avatarInitials: 'BM',
      avatarColor: 'danger',
      steps: 121300,
      isMe: false,
      isFriend: true,
    },
    {
      id: 11,
      name: 'Pedro Cunha',
      avatarInitials: 'PC',
      avatarColor: 'tertiary',
      steps: 109800,
      isMe: false,
      isFriend: false,
    },
    {
      id: 12,
      name: 'Luísa Fonseca',
      avatarInitials: 'LF',
      avatarColor: 'success',
      steps: 98200,
      isMe: false,
      isFriend: false,
    },
    {
      id: 13,
      name: 'Nuno Pinto',
      avatarInitials: 'NP',
      avatarColor: 'warning',
      steps: 84600,
      isMe: false,
      isFriend: false,
    },
    {
      id: 14,
      name: 'Rita Gomes',
      avatarInitials: 'RG',
      avatarColor: 'danger',
      steps: 71000,
      isMe: false,
      isFriend: false,
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

const PODIUM_COLORS: Record<number, string> = {
  1: 'warning',
  2: 'medium',
  3: 'tertiary',
};
const PODIUM_LABELS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-leaderboard',
  templateUrl: 'leaderboard.page.html',
  styleUrls: ['leaderboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonChip,
    IonBadge,
    IonProgressBar,
  ],
})
export class LeaderboardPage {
  readonly challenge = CHALLENGE;
  readonly formatDate = formatDate;

  // Sort once — participants already sorted in mock but this makes it safe
  ranked = computed(() =>
    [...this.challenge.participants].sort((a, b) => b.steps - a.steps),
  );

  myEntry = computed(() => this.ranked().find((p) => p.isMe)!);
  myRank = computed(() => this.ranked().findIndex((p) => p.isMe) + 1);
  myPct = computed(() => this.pct(this.myEntry().steps));
  daysLeft = computed(() => daysRemaining(this.challenge.endDate));

  pct(steps: number): number {
    return Math.min(
      100,
      Math.round((steps / this.challenge.targetSteps) * 100),
    );
  }

  medal(position: number): string {
    return PODIUM_LABELS[position];
  }

  firstName(name: string): string {
    return name.split(' ')[0];
  }

  constructor(private router: Router) {
    addIcons({
      calendarOutline,
      peopleOutline,
      footstepsOutline,
      timeOutline,
      trophyOutline,
      flagOutline,
    });
  }

  goToProfile(participant: Participant) {
    this.router.navigate(['/friend', participant.id]);
  }
}
