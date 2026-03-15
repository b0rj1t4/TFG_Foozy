import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { NavigationService } from '../services/navigation.service';

// ── Types (shared with the rest of the app) ──────────────────────────────────

interface FriendProfile {
  id: number;
  name: string;
  avatarInitials: string;
  avatarColor: string;
  stepsToday: number;
  totalSteps: number;
  rank: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: 'unlocked' | 'locked';
  unlockedAt?: string;
}

interface SharedChallenge {
  id: number;
  title: string;
  targetSteps: number;
  mySteps: number;
  friendSteps: number;
  endDate: string;
  status: 'active' | 'completed';
}

// ── Mock data ────────────────────────────────────────────────────────────────

const ME = {
  name: 'Alex Ramos',
  rank: 18,
  stepsToday: 5820,
  totalSteps: 1240000,
};

const FRIEND: FriendProfile = {
  id: 2,
  name: 'Miguel Ferreira',
  avatarInitials: 'MF',
  avatarColor: 'success',
  stepsToday: 12300,
  totalSteps: 1850000,
  rank: 7,
};

const FRIEND_ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    title: 'Daily Dasher',
    description: '10,000 steps in a day',
    icon: 'footsteps-outline',
    status: 'unlocked',
    unlockedAt: 'Jan 15',
  },
  {
    id: 2,
    title: 'Week Warrior',
    description: '7-day streak',
    icon: 'flame-outline',
    status: 'unlocked',
    unlockedAt: 'Jan 22',
  },
  {
    id: 3,
    title: 'Century Club',
    description: '100,000 total steps',
    icon: 'ribbon-outline',
    status: 'unlocked',
    unlockedAt: 'Feb 3',
  },
  {
    id: 4,
    title: 'Podium Finish',
    description: 'Top 3 in a challenge',
    icon: 'podium-outline',
    status: 'unlocked',
    unlockedAt: 'Feb 10',
  },
  {
    id: 5,
    title: 'Million Mover',
    description: '1,000,000 total steps',
    icon: 'star-outline',
    status: 'unlocked',
    unlockedAt: 'Mar 1',
  },
  {
    id: 6,
    title: 'Monthly Grind',
    description: '30-day streak',
    icon: 'thunderstorm-outline',
    status: 'locked',
  },
  {
    id: 7,
    title: 'Gold Rush',
    description: 'Win 1st place',
    icon: 'trophy-outline',
    status: 'locked',
  },
  {
    id: 8,
    title: 'Legend',
    description: 'Top leaderboard in 100+',
    icon: 'star-outline',
    status: 'locked',
  },
];

const SHARED_CHALLENGES: SharedChallenge[] = [
  {
    id: 1,
    title: 'March Madness',
    targetSteps: 200000,
    mySteps: 134500,
    friendSteps: 182000,
    endDate: 'Mar 31',
    status: 'active',
  },
  {
    id: 2,
    title: 'Office Olympics',
    targetSteps: 1000000,
    mySteps: 680000,
    friendSteps: 820000,
    endDate: 'Mar 28',
    status: 'active',
  },
  {
    id: 3,
    title: 'Weekend Warrior',
    targetSteps: 60000,
    mySteps: 60000,
    friendSteps: 60000,
    endDate: 'Mar 10',
    status: 'completed',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-friend',
  standalone: true,
  imports: [
    CommonModule,
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
    IonNote,
    IonChip,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
  ],
  templateUrl: './friend.page.html',
  styleUrl: './friend.page.scss',
})
export class FriendPage {
  // In a real app these come from a route param + service
  readonly friend = FRIEND;
  readonly me = ME;
  readonly achievements = FRIEND_ACHIEVEMENTS;
  readonly sharedChallenges = SHARED_CHALLENGES;

  unlockedCount = computed(
    () => this.achievements.filter((a) => a.status === 'unlocked').length,
  );

  private maxSteps = computed(() =>
    Math.max(this.me.stepsToday, this.friend.stepsToday),
  );
  myStepsPct = computed(() =>
    Math.round((this.me.stepsToday / this.maxSteps()) * 100),
  );
  friendStepsPct = computed(() =>
    Math.round((this.friend.stepsToday / this.maxSteps()) * 100),
  );

  pct(current: number, target: number): number {
    return Math.min(100, Math.round((current / target) * 100));
  }

  removeFriend() {
    // TODO: call your service, then nav back
    console.log('Unfriended', this.friend.name);
  }

  constructor(public nav: NavigationService) {}
}
