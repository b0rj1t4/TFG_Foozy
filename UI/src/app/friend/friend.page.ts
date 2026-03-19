import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { AvatarComponent } from '../shared/avatar/avatar.component';

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
    AvatarComponent,
    RouterLink,
  ],
  templateUrl: './friend.page.html',
  styleUrl: './friend.page.scss',
})
export class FriendPage {
  isFriend = signal(false);

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
      this.isFriend.set(res.friend.isFriend || false);
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

  addFriend() {
    this.userService.addFriend(this.friend()._id).subscribe({
      next: () => {
        this.isFriend.set(true);
        // Load gated data now that we're friends
        const id = this.route.snapshot.paramMap.get('id')!;
        this.userService
          .getFriendProfile(id)
          .subscribe((res) => this.sharedChallenges.set(res.sharedChallenges));
        this.achievementService
          .getFriendAchievements(id)
          .subscribe((res) => this.achievements.set(res.achievements));
        this.loadFriendSteps(id, this.selectedPeriod());
      },
      error: (err) => console.error('Add friend error', err?.error?.message),
    });
  }

  removeFriend() {
    this.userService.removeFriend(this.friend()._id).subscribe({
      next: () => {
        this.isFriend.set(false);
        // Clear friend-gated data
        this.sharedChallenges.set([]);
        this.achievements.set([]);
        this.friendSteps.set({ steps: [], total: 0 });
      },
      error: (err) => console.error('Remove friend error', err?.error?.message),
    });
  }
}
