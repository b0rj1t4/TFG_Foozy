import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from './services/auth';
import { TokenStorageService } from './services/token';
import { BackgroundRunner } from '@capacitor/background-runner';
import { Health } from '@capgo/capacitor-health';
import { HealthStepsService } from './services/health-steps';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

import * as CapacitorKV from '@capacitor/background-runner';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonicModule],
  providers: [AuthService, TokenStorageService],
  standalone: true,
})
export class AppComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private health: HealthStepsService,
  ) {}

  async ngOnInit() {
    this.auth.init();

    this.init();
    this.testHealth();
    // this.testLoad();

    this.testBackgroundRunner();

    // Only initialise health on a real device
    if (Capacitor.isNativePlatform() && this.auth.isLoggedIn()) {
      await this.initHealth();
    }
  }

  private async initHealth() {
    const granted = await this.health.requestPermissions();
    if (!granted) return;

    // Backfill the last 7 days so the charts have history from day one
    await this.health.backfill(7);

    // Register the 15-min background sync
    await this.health.registerBackgroundSync();
  }

  async init() {
    try {
      const permissions = await BackgroundRunner.requestPermissions({
        apis: ['notifications'],
      });

      // Ask for separate read/write access scopes
      const healthPermissions = await Health.requestAuthorization({
        read: ['steps'],
      });

      console.log('permissions', JSON.stringify(permissions, null, 2));
      console.log(
        'health permissions',
        JSON.stringify(healthPermissions, null, 2),
      );
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
  } // Test the KV Store

  // async testSave() {
  //   const result = await BackgroundRunner.dispatchEvent({
  //     label: 'com.capacitor.background.check',
  //     event: 'fetchTest',
  //     details: {},
  //   });
  //   console.log('save result', JSON.stringify(result, null, 2));
  // }

  // async testLoad() {
  //   const result = await BackgroundRunner.dispatchEvent({
  //     label: 'com.capacitor.background.check',
  //     event: 'testLoad',
  //     details: {},
  //   });
  //   console.log('load result', JSON.stringify(result, null, 2));
  // }

  async testHealth() {
    // Query the last 50 step samples from the past 24 hours
    const { samples } = await Health.readSamples({
      dataType: 'steps',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      limit: 50,
    });
    console.log('step samples', JSON.stringify(samples, null, 2));
  }

  async testBackgroundRunner() {
    const result = await BackgroundRunner.dispatchEvent({
      label: 'com.capacitor.background.check',
      event: 'fetchTest',
      details: {},
    });
    console.log('*--* Background Runner Test *-*-');
    console.log('background runner result', JSON.stringify(result, null, 2));
    console.log('*--* Background Runner Test *-*-');
  }
}
