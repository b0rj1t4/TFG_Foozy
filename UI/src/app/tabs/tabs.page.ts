import { Component } from '@angular/core';
import {
  IonIcon,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonIcon, IonTabs, IonTabBar, IonTabButton, IonLabel],
})
export class TabsPage {
  constructor() {}
}
