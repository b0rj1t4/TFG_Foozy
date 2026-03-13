import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import {
  IonSegment,
  IonBadge,
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
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

export type AchievementCategory =
  | 'all'
  | 'steps'
  | 'streaks'
  | 'wins'
  | 'social';
export type AchievementStatus = 'unlocked' | 'locked' | 'in-progress';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: Exclude<AchievementCategory, 'all'>;
  status: AchievementStatus;
  unlockedAt?: string;
  progress?: number; // 0–1, only for in-progress
  progressLabel?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  // Steps
  {
    id: 1,
    title: 'First Steps',
    description: 'Walk 1,000 steps in a day',
    icon: 'walk-outline',
    category: 'steps',
    status: 'unlocked',
    unlockedAt: 'Jan 2',
  },
  {
    id: 2,
    title: 'Daily Dasher',
    description: 'Reach 10,000 steps in a single day',
    icon: 'footsteps-outline',
    category: 'steps',
    status: 'unlocked',
    unlockedAt: 'Jan 15',
  },
  {
    id: 3,
    title: 'Century Club',
    description: 'Accumulate 100,000 total steps',
    icon: 'footsteps-outline',
    category: 'steps',
    status: 'unlocked',
    unlockedAt: 'Feb 3',
  },
  {
    id: 4,
    title: 'Million Mover',
    description: 'Accumulate 1,000,000 total steps',
    icon: 'star-outline',
    category: 'steps',
    status: 'in-progress',
    progress: 1240000 / 1000000,
    progressLabel: '1,240,000 / 1,000,000',
  },
  {
    id: 5,
    title: 'Marathon Walker',
    description: 'Walk a marathon distance in steps (~56,000)',
    icon: 'ribbon-outline',
    category: 'steps',
    status: 'unlocked',
    unlockedAt: 'Feb 20',
  },
  {
    id: 6,
    title: 'Ultramarathon',
    description: 'Walk 100km worth of steps in a week',
    icon: 'star-outline',
    category: 'steps',
    status: 'locked',
  },

  // Streaks
  {
    id: 7,
    title: 'Just Getting Started',
    description: '3-day activity streak',
    icon: 'flame-outline',
    category: 'streaks',
    status: 'unlocked',
    unlockedAt: 'Jan 5',
  },
  {
    id: 8,
    title: 'Week Warrior',
    description: '7-day activity streak',
    icon: 'flame-outline',
    category: 'streaks',
    status: 'unlocked',
    unlockedAt: 'Jan 12',
  },
  {
    id: 9,
    title: 'Two-Week Titan',
    description: '14-day activity streak',
    icon: 'flame-outline',
    category: 'streaks',
    status: 'in-progress',
    progress: 10 / 14,
    progressLabel: '10 / 14 days',
  },
  {
    id: 10,
    title: 'Monthly Grind',
    description: '30-day activity streak',
    icon: 'thunderstorm-outline',
    category: 'streaks',
    status: 'locked',
  },
  {
    id: 11,
    title: 'Unstoppable',
    description: '100-day activity streak',
    icon: 'star-outline',
    category: 'streaks',
    status: 'locked',
  },

  // Wins
  {
    id: 12,
    title: 'Podium Finish',
    description: 'Finish top 3 in any challenge',
    icon: 'podium-outline',
    category: 'wins',
    status: 'unlocked',
    unlockedAt: 'Feb 10',
  },
  {
    id: 13,
    title: 'Gold Rush',
    description: 'Win 1st place in a challenge',
    icon: 'trophy-outline',
    category: 'wins',
    status: 'locked',
  },
  {
    id: 14,
    title: 'Hat Trick',
    description: 'Win 3 challenges',
    icon: 'trophy-outline',
    category: 'wins',
    status: 'locked',
  },
  {
    id: 15,
    title: 'Comeback Kid',
    description: 'Finish top 10 after being ranked 50+',
    icon: 'ribbon-outline',
    category: 'wins',
    status: 'locked',
  },
  {
    id: 16,
    title: 'Consistent Contender',
    description: 'Complete 5 challenges',
    icon: 'ribbon-outline',
    category: 'wins',
    status: 'in-progress',
    progress: 3 / 5,
    progressLabel: '3 / 5 challenges',
  },

  // Social
  {
    id: 17,
    title: 'Team Player',
    description: 'Join your first group challenge',
    icon: 'people-outline',
    category: 'social',
    status: 'unlocked',
    unlockedAt: 'Jan 8',
  },
  {
    id: 18,
    title: 'Hype Machine',
    description: 'Be the most active member in a group for a week',
    icon: 'heart-outline',
    category: 'social',
    status: 'locked',
  },
  {
    id: 19,
    title: 'Social Butterfly',
    description: 'Participate in 3 different group challenges',
    icon: 'people-outline',
    category: 'social',
    status: 'in-progress',
    progress: 2 / 3,
    progressLabel: '2 / 3 groups',
  },
  {
    id: 20,
    title: 'Legend',
    description: 'Top the leaderboard in a group of 100+ people',
    icon: 'star-outline',
    category: 'social',
    status: 'locked',
  },
];

@Component({
  selector: 'app-achievements',
  templateUrl: 'achievements.page.html',
  styleUrls: ['achievements.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonNote,
    IonProgressBar,
    IonChip,
    IonSegment,
    IonSegmentButton,
    IonContent,
  ],
})
export class AchievementsPage {
  selectedCategory = signal<AchievementCategory>('all');

  onCategoryChange(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value as AchievementCategory);
  }

  private filtered = computed(() => {
    const cat = this.selectedCategory();
    return cat === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === cat);
  });

  unlockedFiltered = computed(() =>
    this.filtered().filter((a) => a.status === 'unlocked'),
  );
  inProgressFiltered = computed(() =>
    this.filtered().filter((a) => a.status === 'in-progress'),
  );
  lockedFiltered = computed(() =>
    this.filtered().filter((a) => a.status === 'locked'),
  );

  total = computed(() => ACHIEVEMENTS.length);
  unlockedCount = computed(
    () => ACHIEVEMENTS.filter((a) => a.status === 'unlocked').length,
  );
  inProgressCount = computed(
    () => ACHIEVEMENTS.filter((a) => a.status === 'in-progress').length,
  );
  unlockedPct = computed(() =>
    Math.round((this.unlockedCount() / this.total()) * 100),
  );
}
