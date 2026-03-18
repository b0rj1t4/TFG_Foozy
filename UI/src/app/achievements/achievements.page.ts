import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import {
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
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AchievementService } from '../services/achievement';

type AchievementCategory = 'all' | 'steps' | 'streaks' | 'wins' | 'social';

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
export class AchievementsPage implements OnInit {
  constructor(private achievementService: AchievementService) {}
  ngOnInit() {
    this.achievementService.getAll().subscribe();
  }

  selectedCategory = signal<AchievementCategory>('all');

  onCategoryChange(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value as AchievementCategory);
  }

  private filtered = computed(() => {
    const cat = this.selectedCategory();
    const list =
      cat === 'all'
        ? this.achievementService.achievements()
        : this.achievementService.forCategory(cat as any);
    return list;
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
  unlockedCount = this.achievementService.unlockedCount;
  total = this.achievementService.totalCount;
  unlockedPct = this.achievementService.completionPct;
  inProgressCount = computed(() => this.achievementService.inProgress().length);
}
