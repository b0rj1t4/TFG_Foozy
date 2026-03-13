import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

interface Player {
  rank: number;
  image: string;
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
      {
        rank: 1,
        name: 'Emma Johnson',
        points: 95,
        image: 'https://randomuser.me/api/portraits/women/37.jpg',
      },
      {
        rank: 2,
        name: 'Liam Carter',
        points: 90,
        image: 'https://randomuser.me/api/portraits/men/12.jpg',
      },
      {
        rank: 3,
        name: 'Olivia Martinez',
        points: 86,
        image: 'https://randomuser.me/api/portraits/women/22.jpg',
      },
      {
        rank: 4,
        name: 'Noah Thompson',
        points: 82,
        image: 'https://randomuser.me/api/portraits/men/45.jpg',
      },
      {
        rank: 5,
        name: 'Sophia Williams',
        points: 79,
        image: 'https://randomuser.me/api/portraits/women/18.jpg',
      },
      {
        rank: 6,
        name: 'James Anderson',
        points: 74,
        image: 'https://randomuser.me/api/portraits/men/33.jpg',
      },
      {
        rank: 7,
        name: 'Isabella Moore',
        points: 71,
        image: 'https://randomuser.me/api/portraits/women/50.jpg',
      },
      {
        rank: 8,
        name: 'Benjamin Taylor',
        points: 67,
        image: 'https://randomuser.me/api/portraits/men/29.jpg',
      },
      {
        rank: 9,
        name: 'Mia Garcia',
        points: 63,
        image: 'https://randomuser.me/api/portraits/women/41.jpg',
      },
      {
        rank: 10,
        name: 'Lucas Rodriguez',
        points: 60,
        image: 'https://randomuser.me/api/portraits/men/52.jpg',
      },
    ];

    this.topThree = allPlayers.slice(0, 3);
    this.remainingPlayers = allPlayers.slice(3);
  }
}
