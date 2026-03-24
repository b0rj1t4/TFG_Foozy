import { Component, OnInit } from '@angular/core';
import { BackgroundRunner } from '@capacitor/background-runner';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { IonicModule } from '@ionic/angular';
import { AuthService } from './services/auth';
import { HealthStepsService } from './services/health-steps';
import { TokenStorageService } from './services/token';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';
const BACKFILL_DONE_KEY = 'health_backfill_done';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonicModule],
  providers: [AuthService, TokenStorageService],
  standalone: true,
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService, private health: HealthStepsService) {}

  async ngOnInit() {
    await this.auth.init();

    // Only initialize health on a real device
    if (Capacitor.isNativePlatform() && this.auth.isLoggedIn()) {
      await this.initHealth();

      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) this.health.syncToday();
      });
    }
  }

  private async initHealth() {
    const granted = await this.health.requestPermissions();
    if (!granted) return;

    await Preferences.set({ key: 'api_base_url', value: environment.apiUrl });

    // Backfill last 7 days only once per install
    const backfillDone = await Preferences.get({ key: BACKFILL_DONE_KEY });

    if (!backfillDone?.value) {
      await this.health.backfill(7);
      await Preferences.set({ key: BACKFILL_DONE_KEY, value: 'true' });
    }

    // Always sync today on every app open — safe because backend upserts
    await this.health.syncToday();

    // Register the 15-min background sync
    await this.health.registerBackgroundSync();
  }
}
