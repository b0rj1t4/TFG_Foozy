import { Component } from '@angular/core';
import {
  IonIcon,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonBadge,
} from '@ionic/angular/standalone';

// In a real app this comes from your AuthService / UserStore
const CURRENT_USER = {
  initials: 'AR',
  avatarColor: 'primary',
};

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class TabsPage {
  readonly user = CURRENT_USER;
  constructor() {}
}
