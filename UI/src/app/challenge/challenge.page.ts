import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ActionSheetController,
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
  IonNote,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ChallengeService, RankingEntry } from '../services/challenges';
import { NavigationService } from '../services/navigation.service';
import { UserService } from '../services/user';
import { AvatarComponent } from '../shared/avatar/avatar.component';

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

@Component({
  selector: 'app-challenge',
  templateUrl: 'challenge.page.html',
  styleUrls: ['challenge.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonChip,
    IonBadge,
    IonProgressBar,
    IonSpinner,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonAvatar,
    AvatarComponent,
  ],
})
export class ChallengePage implements OnInit {
  readonly formatDate = formatDate;

  // ── State ──────────────────────────────────────────────────────────────────
  loading = signal(true);
  loadingRanking = signal(true);
  joining = signal(false);
  leaving = signal(false);

  ranking = signal<RankingEntry[]>([]);

  // ── Derived ────────────────────────────────────────────────────────────────
  challenge = this.challengeService.activeChallenge;

  isOwner = computed(() => {
    const me = this.userService.currentUser();
    const c = this.challenge();
    return !!me && !!c && c.createdBy._id === me._id;
  });

  isJoined = computed(() => this.challenge()?.joined ?? false);

  myEntry = computed(() => this.ranking().find((e) => e.isMe) ?? null);
  myPct = computed(() => this.myEntry()?.pct ?? 0);
  daysLeft = computed(() =>
    this.challenge() ? daysRemaining(this.challenge()!.endDate) : 0,
  );

  listEntries = computed(() =>
    this.ranking().length >= 3 ? this.ranking().slice(3) : this.ranking(),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public nav: NavigationService,
    private challengeService: ChallengeService,
    private userService: UserService,
    private actionSheetCtrl: ActionSheetController,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadData(id);
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private loadData(id: string) {
    this.loading.set(true);
    this.loadingRanking.set(true);

    this.challengeService.getChallengeById(id).subscribe({
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });

    this.challengeService.getRanking(id).subscribe({
      next: (res) => this.ranking.set(res.ranking),
      complete: () => this.loadingRanking.set(false),
      error: () => this.loadingRanking.set(false),
    });
  }

  onRefresh(event: CustomEvent) {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadData(id);
    setTimeout(
      () => (event.target as HTMLIonRefresherElement).complete(),
      1500,
    );
  }

  // ── Join ──────────────────────────────────────────────────────────────────

  joinChallenge() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.joining.set(true);
    this.challengeService.joinChallenge(id).subscribe({
      next: () => this.loadData(id),
      error: (err) => {
        console.error('Join error', err?.error?.message);
        this.joining.set(false);
      },
    });
  }

  leaveChallenge() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.leaving.set(true);
    this.challengeService.leaveChallenge(id).subscribe({
      next: () => this.loadData(id),
      error: (err) => {
        console.error('Leave error', err?.error?.message);
        this.leaving.set(false);
      },
    });
  }

  // ── Edit / Update ─────────────────────────────────────────────────────────

  editChallenge() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.router.navigate(['/challenge/edit', id]);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deleteChallenge() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Delete this challenge?',
      subHeader: 'This cannot be undone.',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            const id = this.route.snapshot.paramMap.get('id')!;
            this.challengeService.deleteChallenge(id).subscribe({
              next: () => this.nav.back(),
              error: (err) =>
                console.error('Delete error', err?.error?.message),
            });
          },
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  firstName(name: string): string {
    return name.split(' ')[0];
  }

  isFriend(userId: string): boolean {
    return this.userService.isFriend(userId);
  }

  goToProfile(entry: RankingEntry) {
    if (entry.isMe) return;

    this.router.navigate(['/friend', entry.user._id]);
  }
}
