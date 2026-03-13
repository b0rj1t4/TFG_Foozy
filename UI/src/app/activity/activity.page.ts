import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
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
  IonProgressBar,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

export type FilterPeriod = 'today' | 'week' | 'month' | 'year';
export interface Challenge {
  id: number;
  title: string;
  description: string;
  targetSteps: number;
  currentSteps: number;
  participants: number;
  yourRank: number;
  status: 'active' | 'completed' | 'upcoming';
  endDate: string;
  badge: string;
}

const ALL_CHALLENGES: Challenge[] = [
  // TODAY
  {
    id: 1,
    title: 'Morning Mover',
    description: 'Hit 5,000 steps before noon',
    targetSteps: 5000,
    currentSteps: 3820,
    participants: 142,
    yourRank: 18,
    status: 'active',
    endDate: 'Today',
    badge: 'today',
  },
  {
    id: 2,
    title: 'Lunch Loop',
    description: 'Take a 2,000-step walk at lunch',
    targetSteps: 2000,
    currentSteps: 2000,
    participants: 87,
    yourRank: 5,
    status: 'completed',
    endDate: 'Today',
    badge: 'today',
  },
  // MONTH
  {
    id: 3,
    title: 'March Madness',
    description: '200,000 steps this month',
    targetSteps: 200000,
    currentSteps: 134500,
    participants: 512,
    yourRank: 34,
    status: 'active',
    endDate: 'Mar 31',
    badge: 'month',
  },
  {
    id: 4,
    title: 'Office Olympics',
    description: 'Team challenge — 1M steps combined',
    targetSteps: 1000000,
    currentSteps: 680000,
    participants: 24,
    yourRank: 7,
    status: 'active',
    endDate: 'Mar 28',
    badge: 'month',
  },
  {
    id: 5,
    title: 'Weekend Warrior',
    description: '15,000 steps each weekend day',
    targetSteps: 60000,
    currentSteps: 60000,
    participants: 198,
    yourRank: 12,
    status: 'completed',
    endDate: 'Mar 10',
    badge: 'month',
  },
  // YEAR
  {
    id: 6,
    title: 'New Year Stride',
    description: '3,000,000 steps by year end',
    targetSteps: 3000000,
    currentSteps: 1240000,
    participants: 1024,
    yourRank: 89,
    status: 'active',
    endDate: 'Dec 31',
    badge: 'year',
  },
  {
    id: 7,
    title: 'Across the Country',
    description: 'Walk the equivalent of 5,000 km',
    targetSteps: 6500000,
    currentSteps: 1240000,
    participants: 310,
    yourRank: 45,
    status: 'active',
    endDate: 'Dec 31',
    badge: 'year',
  },
  {
    id: 8,
    title: 'Spring Sprinter',
    description: '500,000 steps in Q1',
    targetSteps: 500000,
    currentSteps: 500000,
    participants: 430,
    yourRank: 22,
    status: 'completed',
    endDate: 'Mar 31',
    badge: 'year',
  },
  {
    id: 9,
    title: 'Summer Surge',
    description: '800,000 steps in Q3',
    targetSteps: 800000,
    currentSteps: 0,
    participants: 0,
    yourRank: 0,
    status: 'upcoming',
    endDate: 'Sep 30',
    badge: 'year',
  },
];

const STATS: Record<
  FilterPeriod,
  { steps: number; position: number; challenges: number }
> = {
  today: { steps: 5820, position: 18, challenges: 2 },
  week: { steps: 25000, position: 12, challenges: 1 },

  month: { steps: 134500, position: 34, challenges: 3 },
  year: { steps: 1240000, position: 89, challenges: 4 },
};

@Component({
  selector: 'app-activity',
  templateUrl: 'activity.page.html',
  styleUrls: ['activity.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonNote,
    IonProgressBar,
    IonBadge,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonListHeader,
  ],
})
export class ActivityPage {
  selectedPeriod = signal<FilterPeriod>('today');
  currentStats = computed(() => STATS[this.selectedPeriod()]);

  filteredChallenges = computed<Challenge[]>(() => {
    console.log('Filtering challenges for period:', this.selectedPeriod);
    if (this.selectedPeriod() === 'today') {
      return ALL_CHALLENGES.filter((c) => c.badge === 'today');
    }
    if (this.selectedPeriod() === 'month') {
      return ALL_CHALLENGES.filter(
        (c) => c.badge === 'today' || c.badge === 'month',
      );
    }
    return ALL_CHALLENGES;
  });

  completedCount = computed(
    () =>
      this.filteredChallenges().filter((c) => c.status === 'completed').length,
  );

  stepGoalPercent = computed(() => {
    const goals: Record<FilterPeriod, number> = {
      today: 10000,
      week: 25000,
      month: 300000,
      year: 3650000,
    };
    return Math.min(
      100,
      Math.round(
        (this.currentStats().steps / goals[this.selectedPeriod()]) * 100,
      ),
    );
  });

  rankLabel = computed(() => {
    const r = this.currentStats().position;
    if (r <= 10) return 'Top 10!';
    if (r <= 25) return 'Top 25';
    if (r <= 50) return 'Top 50';
    return 'Keep going!';
  });

  onPeriodChange(event: CustomEvent) {
    this.selectedPeriod.set(event.detail.value as FilterPeriod);
  }

  constructor() {}

  progressPct(c: Challenge): number {
    return Math.min(100, Math.round((c.currentSteps / c.targetSteps) * 100));
  }

  statusIcon(status: Challenge['status']): string {
    if (status === 'completed') return 'checkmark-circle';
    if (status === 'upcoming') return 'lock-closed-outline';
    return 'flame-outline';
  }

  statusColor(status: Challenge['status']): string {
    if (status === 'completed') return 'success';
    if (status === 'upcoming') return 'medium';
    return 'primary';
  }
}
