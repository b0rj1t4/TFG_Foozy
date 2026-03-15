import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'achievements',
        loadComponent: () =>
          import('./achievements/achievements.page').then(
            (m) => m.AchievementsPage,
          ),
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./activity/activity.page').then((m) => m.ActivityPage),
      },
      {
        path: 'challenges',
        loadComponent: () =>
          import('./challenges/challenges.page').then((m) => m.ChallengesPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: '/tabs/activity',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'challenge',
    children: [
      {
        path: 'create',
        loadComponent: () =>
          import('./create-challenge/create-challenge.page').then(
            (m) => m.CreateChallengePage,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./leaderboard/leaderboard.page').then(
            (m) => m.LeaderboardPage,
          ),
      },
    ],
  },

  {
    path: 'friend/:id',
    loadComponent: () =>
      import('./friend/friend.page').then((m) => m.FriendPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
