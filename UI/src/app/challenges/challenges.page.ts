import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {
  Challenge,
  ChallengeService,
  ChallengeStatus,
} from '../services/challenges';

// ── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | ChallengeStatus;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ChallengeStatus, string> = {
  active: 'primary',
  completed: 'success',
  upcoming: 'medium',
};

function daysLeft(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

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
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class ChallengesPage implements OnInit {
  readonly STATUS_COLOR = STATUS_COLOR;
  readonly daysLeft = daysLeft;
  readonly skeletonRows = Array(4);

  // ── State ──────────────────────────────────────────────────────────────────
  activeTab = signal<FilterTab>('all');
  query = signal('');
  loading = signal(true);

  // ── Computed ───────────────────────────────────────────────────────────────
  private byTab = computed<Challenge[]>(() => {
    const tab = this.activeTab();
    const all = this.challengeService.challenges();
    return tab === 'all' ? all : all.filter((c) => c.status === tab);
  });

  filtered = computed<Challenge[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.byTab();
    return this.byTab().filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
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

  constructor(
    private router: Router,
    private challengeService: ChallengeService,
  ) {}

  ngOnInit() {
    this.loadChallenges();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private loadChallenges() {
    this.loading.set(true);
    this.challengeService.getChallenges().subscribe({
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  onRefresh(event: CustomEvent) {
    this.challengeService.getChallenges().subscribe({
      complete: () => (event.target as HTMLIonRefresherElement).complete(),
      error: () => (event.target as HTMLIonRefresherElement).complete(),
    });
  }

  // ── Events ────────────────────────────────────────────────────────────────

  onTabChange(e: CustomEvent) {
    this.activeTab.set(e.detail.value as FilterTab);
  }

  onSearch(e: CustomEvent) {
    this.query.set((e.detail.value as string) ?? '');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  pct(c: Challenge): number {
    if (!c.mySteps || !c.targetSteps) return 0;
    return Math.min(100, Math.round((c.mySteps / c.targetSteps) * 100));
  }

  goToChallenge(c: Challenge) {
    this.router.navigate(['/challenge', c._id]);
  }

  goToCreate() {
    this.router.navigate(['/challenge/create']);
  }
}
