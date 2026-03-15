import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { filter } from 'rxjs/operators';

const MAIN_ROUTE = '/tabs/activity';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private history: string[] = [];

  constructor(
    private router: Router,
    private navCtrl: NavController,
  ) {
    // Track every completed navigation so we always know where we came from
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        // Don't push the same route twice in a row
        const last = this.history[this.history.length - 1];
        if (last !== e.urlAfterRedirects) {
          console.log('Navigated to', e.urlAfterRedirects);
          this.history.push(e.urlAfterRedirects);
        }
      });
  }

  /**
   * Go back one step in history.
   * If there's no previous route (e.g. deep-linked directly), fall back to MAIN_ROUTE.
   */
  back(): void {
    // history[last] is the current page, history[last-1] is where we came from
    console.log('Navigation history:', this.history);
    if (this.history.length > 1) {
      this.history.pop(); // remove current
      this.navCtrl.back(); // uses Ionic's back animation
    } else {
      this.navCtrl.navigateRoot(MAIN_ROUTE, {
        animated: true,
        animationDirection: 'back',
      });
    }
  }

  /** Peek at where we came from without mutating history */
  get previousUrl(): string | null {
    return this.history.length > 1
      ? this.history[this.history.length - 2]
      : null;
  }
}
