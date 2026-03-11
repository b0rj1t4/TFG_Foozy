import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

interface Player {
  rank: number;
  name: string;
  points: number;
  avatar?: string;
}
@Component({
  selector: 'app-leaderboard',
  templateUrl: 'leaderboard.page.html',
  styleUrls: ['leaderboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class LeaderboardPage implements OnInit {
  topThree: Player[] = [];
  remainingPlayers: Player[] = [];

  ngOnInit() {
    // Sample data - replace with your actual data source
    const allPlayers: Player[] = [
      { rank: 1, name: 'Player Name', points: 43 },
      { rank: 2, name: 'Player Name', points: 40 },
      { rank: 3, name: 'Player Name', points: 38 },
      { rank: 4, name: 'Player Name', points: 36 },
      { rank: 5, name: 'Player Name', points: 35 },
      { rank: 6, name: 'Player Name', points: 34 },
      { rank: 7, name: 'Player Name', points: 34 },
      { rank: 8, name: 'Player Name', points: 33 },
      { rank: 9, name: 'Player Name', points: 30 },
      { rank: 10, name: 'Player Name', points: 29 },
    ];

    this.topThree = allPlayers.slice(0, 3);
    this.remainingPlayers = allPlayers.slice(3);
  }
}
