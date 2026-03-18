import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { Challenge, ChallengeService } from '../services/challenges';
import { StepsService } from '../services/steps';

export type FilterPeriod = 'today' | 'week' | 'month' | 'year';

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
    IonImg,
    IonSpinner,
    IonThumbnail,
    IonRefresherContent,
    IonRefresher,
  ],
})
export class ActivityPage implements OnInit {
  selectedPeriod = signal<FilterPeriod>('today');
  loadingSteps = signal(true);
  loadingChallenges = signal(true);

  constructor(
    private stepsService: StepsService,
    private challengeService: ChallengeService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadData() {
    this.loadingSteps.set(true);
    this.loadingChallenges.set(true);

    // Load all step periods in parallel so switching the dropdown is instant
    forkJoin([
      this.stepsService.getMySteps('today'),
      this.stepsService.getMySteps('week'),
      this.stepsService.getMySteps('month'),
      this.stepsService.getMySteps('year'),
    ]).subscribe({
      complete: () => this.loadingSteps.set(false),
    });

    // Load only joined challenges for the activity view
    this.challengeService.getChallenges({ joined: true }).subscribe({
      complete: () => this.loadingChallenges.set(false),
    });
  }

  onRefresh(event: CustomEvent) {
    // Re-fetch everything then complete the refresher
    forkJoin([
      this.stepsService.getMySteps('today'),
      this.stepsService.getMySteps('week'),
      this.stepsService.getMySteps('month'),
      this.stepsService.getMySteps('year'),
      this.challengeService.getChallenges({ joined: true }),
    ]).subscribe({
      complete: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  onPeriodChange(event: CustomEvent) {
    this.selectedPeriod.set(event.detail.value as FilterPeriod);
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  stepsTotal = computed(() => this.stepsService[this.selectedPeriod()]().total);

  stepGoalPercent = computed(() =>
    this.stepsService.pctFor(this.selectedPeriod()),
  );

  // ── Challenges ────────────────────────────────────────────────────────────

  filteredChallenges = computed<Challenge[]>(() => {
    const period = this.selectedPeriod();
    const joined = this.challengeService.joinedChallenges();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    if (period === 'today') {
      return joined.filter((c) => c.status === 'active');
    }

    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      return joined.filter((c) => new Date(c.endDate) >= weekAgo);
    }

    if (period === 'month') {
      return joined.filter((c) => {
        const end = new Date(c.endDate);
        return end.getMonth() === thisMonth && end.getFullYear() === thisYear;
      });
    }

    // Year
    return joined.filter((c) => {
      const end = new Date(c.endDate);
      return end.getFullYear() === thisYear;
    });
  });

  completedCount = computed(
    () =>
      this.filteredChallenges().filter((c) => c.status === 'completed').length,
  );

  bestRank = computed(() => {
    const ranks = this.filteredChallenges()
      .map((c) => c.myRank)
      .filter((r): r is number => !!r);
    return ranks.length ? Math.min(...ranks) : null;
  });

  rankLabel = computed(() => {
    const r = this.bestRank();
    if (!r) return 'No rank yet';
    if (r <= 3) return 'Podium! 🏆';
    if (r <= 10) return 'Top 10!';
    if (r <= 25) return 'Top 25';
    if (r <= 50) return 'Top 50';
    return 'Keep going!';
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  progressPct(c: Challenge): number {
    if (!c.mySteps || !c.targetSteps) return 0;
    return Math.min(100, Math.round((c.mySteps / c.targetSteps) * 100));
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

  goToChallenge(challenge: Challenge) {
    this.router.navigate(['/challenge', challenge._id]);
  }
}
