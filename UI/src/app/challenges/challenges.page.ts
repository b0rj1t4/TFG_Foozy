import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonBadge,
  IonProgressBar,
  IonChip,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonListHeader,
  IonThumbnail,
  IonImg,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trophyOutline,
  timeOutline,
  peopleOutline,
  footstepsOutline,
  checkmarkCircle,
  lockClosedOutline,
  ribbonOutline,
  flagOutline,
} from 'ionicons/icons';

// ── Types ────────────────────────────────────────────────────────────────────

type ChallengeStatus = 'active' | 'completed' | 'upcoming';
type FilterTab = 'all' | 'active' | 'completed' | 'upcoming';

interface Challenge {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  targetSteps: number;
  mySteps: number;
  participants: number;
  myRank: number;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  daysLeft: number;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: 'March Madness',
    description: 'Hit 200,000 steps before the month is over.',
    coverUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80',
    targetSteps: 200000,
    mySteps: 134500,
    participants: 512,
    myRank: 10,
    status: 'active',
    startDate: 'Mar 1',
    endDate: 'Mar 31',
    daysLeft: 16,
  },
  {
    id: 2,
    title: 'Office Olympics',
    description: 'Team challenge — 1M combined steps.',
    coverUrl:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80',
    targetSteps: 1000000,
    mySteps: 680000,
    participants: 24,
    myRank: 7,
    status: 'active',
    startDate: 'Mar 1',
    endDate: 'Mar 28',
    daysLeft: 13,
  },
  {
    id: 3,
    title: 'Morning Mover',
    description: 'Hit 5,000 steps before noon every day.',
    coverUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80',
    targetSteps: 50000,
    mySteps: 50000,
    participants: 142,
    myRank: 18,
    status: 'completed',
    startDate: 'Feb 1',
    endDate: 'Feb 28',
    daysLeft: 0,
  },
  {
    id: 4,
    title: 'Weekend Warrior',
    description: '15,000 steps each weekend day this month.',
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    targetSteps: 60000,
    mySteps: 60000,
    participants: 198,
    myRank: 12,
    status: 'completed',
    startDate: 'Feb 5',
    endDate: 'Mar 10',
    daysLeft: 0,
  },
  {
    id: 5,
    title: 'Spring Sprint',
    description: 'Kick off spring with 300,000 steps in April.',
    coverUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80',
    targetSteps: 300000,
    mySteps: 0,
    participants: 0,
    myRank: 0,
    status: 'upcoming',
    startDate: 'Apr 1',
    endDate: 'Apr 30',
    daysLeft: 0,
  },
  {
    id: 6,
    title: 'Summer Surge',
    description: '800,000 steps across the whole summer.',
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    targetSteps: 800000,
    mySteps: 0,
    participants: 0,
    myRank: 0,
    status: 'upcoming',
    startDate: 'Jun 1',
    endDate: 'Aug 31',
    daysLeft: 0,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ICON: Record<ChallengeStatus, string> = {
  active: 'flag-outline',
  completed: 'checkmark-circle',
  upcoming: 'lock-closed-outline',
};

const STATUS_COLOR: Record<ChallengeStatus, string> = {
  active: 'primary',
  completed: 'success',
  upcoming: 'medium',
};

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-challenges',
  templateUrl: 'challenges.page.html',
  styleUrls: ['challenges.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonProgressBar,
    IonFab,
    IonFabButton,
    IonSegment,
    IonSegmentButton,
    IonSearchbar,
    IonListHeader,
    IonThumbnail,
    IonImg,
  ],
})
export class ChallengesPage {
  readonly STATUS_COLOR = STATUS_COLOR;

  activeTab = signal<FilterTab>('all');
  query = signal('');

  private byTab = computed(() => {
    const tab = this.activeTab();
    return tab === 'all'
      ? CHALLENGES
      : CHALLENGES.filter((c) => c.status === tab);
  });

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.byTab();
    return this.byTab().filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  });

  tabLabel = computed(() => {
    const map: Record<FilterTab, string> = {
      all: 'All challenges',
      active: 'Active',
      completed: 'Completed',
      upcoming: 'Upcoming',
    };
    return map[this.activeTab()];
  });

  pct(c: Challenge): number {
    return Math.min(100, Math.round((c.mySteps / c.targetSteps) * 100));
  }

  onTabChange(e: CustomEvent) {
    this.activeTab.set(e.detail.value as FilterTab);
  }

  onSearch(e: CustomEvent) {
    this.query.set((e.detail.value as string) ?? '');
  }

  constructor(private router: Router) {
    addIcons({
      addOutline,
      trophyOutline,
      timeOutline,
      peopleOutline,
      footstepsOutline,
      checkmarkCircle,
      lockClosedOutline,
      ribbonOutline,
      flagOutline,
    });
  }

  goToChallenge(c: Challenge) {
    this.router.navigate(['/challenge', c.id]);
  }

  goToCreate() {
    this.router.navigate(['/challenge/create']);
  }
}
