import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AchievementService } from '../services/achievement';
import { NavigationService } from '../services/navigation.service';
import { StepPeriod, StepsService, StepSummary } from '../services/steps';
import { UserService } from '../services/user';

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

// const ME = {
//   name: 'Alex Ramos',
//   rank: 18,
//   stepsToday: 5820,
//   totalSteps: 1240000,
// };

// const FRIEND: FriendProfile = {
//   id: 2,
//   name: 'Miguel Ferreira',
//   avatarInitials: 'MF',
//   avatarColor: 'success',
//   stepsToday: 12300,
//   totalSteps: 1850000,
//   rank: 7,
// };

// const FRIEND_ACHIEVEMENTS: Achievement[] = [
//   {
//     id: 1,
//     title: 'Daily Dasher',
//     description: '10,000 steps in a day',
//     icon: 'footsteps-outline',
//     status: 'unlocked',
//     unlockedAt: 'Jan 15',
//   },
//   {
//     id: 2,
//     title: 'Week Warrior',
//     description: '7-day streak',
//     icon: 'flame-outline',
//     status: 'unlocked',
//     unlockedAt: 'Jan 22',
//   },
//   {
//     id: 3,
//     title: 'Century Club',
//     description: '100,000 total steps',
//     icon: 'ribbon-outline',
//     status: 'unlocked',
//     unlockedAt: 'Feb 3',
//   },
//   {
//     id: 4,
//     title: 'Podium Finish',
//     description: 'Top 3 in a challenge',
//     icon: 'podium-outline',
//     status: 'unlocked',
//     unlockedAt: 'Feb 10',
//   },
//   {
//     id: 5,
//     title: 'Million Mover',
//     description: '1,000,000 total steps',
//     icon: 'star-outline',
//     status: 'unlocked',
//     unlockedAt: 'Mar 1',
//   },
//   {
//     id: 6,
//     title: 'Monthly Grind',
//     description: '30-day streak',
//     icon: 'thunderstorm-outline',
//     status: 'locked',
//   },
//   {
//     id: 7,
//     title: 'Gold Rush',
//     description: 'Win 1st place',
//     icon: 'trophy-outline',
//     status: 'locked',
//   },
//   {
//     id: 8,
//     title: 'Legend',
//     description: 'Top leaderboard in 100+',
//     icon: 'star-outline',
//     status: 'locked',
//   },
// ];

// const SHARED_CHALLENGES: SharedChallenge[] = [
//   {
//     id: 1,
//     title: 'March Madness',
//     targetSteps: 200000,
//     mySteps: 134500,
//     friendSteps: 182000,
//     endDate: 'Mar 31',
//     status: 'active',
//   },
//   {
//     id: 2,
//     title: 'Office Olympics',
//     targetSteps: 1000000,
//     mySteps: 680000,
//     friendSteps: 820000,
//     endDate: 'Mar 28',
//     status: 'active',
//   },
//   {
//     id: 3,
//     title: 'Weekend Warrior',
//     targetSteps: 60000,
//     mySteps: 60000,
//     friendSteps: 60000,
//     endDate: 'Mar 10',
//     status: 'completed',
//   },
// ];

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
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './friend.page.html',
  styleUrl: './friend.page.scss',
})
export class FriendPage {
  friend = signal<any>(null);
  achievements = signal<any[]>([]);
  sharedChallenges = signal<any[]>([]);

  // Steps — friend and own, for the comparison bars
  selectedPeriod = signal<StepPeriod>('today');
  friendSteps = signal<StepSummary>({ steps: [], total: 0 });

  // ── Computed ───────────────────────────────────────────────────────────────
  unlockedCount = computed(
    () => this.achievements().filter((a) => a.status === 'unlocked').length,
  );

  myStepsTotal = computed(
    () => this.stepsService[this.selectedPeriod()]().total,
  );
  friendStepsTotal = computed(() => this.friendSteps().total);

  private maxSteps = computed(
    () => Math.max(this.myStepsTotal(), this.friendStepsTotal()) || 1,
  );

  myStepsPct = computed(() =>
    Math.round((this.myStepsTotal() / this.maxSteps()) * 100),
  );
  friendStepsPct = computed(() =>
    Math.round((this.friendStepsTotal() / this.maxSteps()) * 100),
  );

  // Current user for the "vs" comparison
  me = this.userService.currentUser;

  constructor(
    public nav: NavigationService,
    private route: ActivatedRoute,
    private userService: UserService,
    private achievementService: AchievementService,
    private stepsService: StepsService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    // Friend profile + shared challenges
    this.userService.getFriendProfile(id).subscribe((res) => {
      this.friend.set(res.friend);
      this.sharedChallenges.set(res.sharedChallenges);
    });

    // Friend achievements
    this.achievementService
      .getFriendAchievements(id)
      .subscribe((res) => this.achievements.set(res.achievements));

    // Own steps (all periods — needed for the comparison bar)
    this.stepsService.loadAll();

    // Friend steps for the default period
    this.loadFriendSteps(id, this.selectedPeriod());
  }

  onPeriodChange(period: StepPeriod) {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.selectedPeriod.set(period);
    this.loadFriendSteps(id, period);
  }

  private loadFriendSteps(friendId: string, period: StepPeriod) {
    this.stepsService
      .getFriendSteps(friendId, period)
      .subscribe((res) => this.friendSteps.set(res));
  }

  pct(current: number, target: number): number {
    return Math.min(100, Math.round((current / target) * 100));
  }

  removeFriend() {
    this.userService.removeFriend(this.friend()._id).subscribe({
      next: () => this.nav.back(),
      error: (err) => console.error('Remove friend error', err?.error?.message),
    });
  }
}
