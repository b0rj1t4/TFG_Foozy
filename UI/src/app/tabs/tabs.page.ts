import { Component } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { UserService } from '../services/user';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    AvatarComponent,
  ],
})
export class TabsPage {
  readonly currentUser = this.userService.currentUser;

  constructor(private userService: UserService) {}
}
