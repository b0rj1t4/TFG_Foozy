import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-challenges',
  templateUrl: 'challenges.page.html',
  styleUrls: ['challenges.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ChallengesPage {
  activities = [
    {
      id: 1,
      title: 'Morning Run',
      goal: 'Improve cardiovascular health',
      description:
        'A light 5km run around the neighborhood park to stay active and start the day energized.',
      from: '2026-03-01',
      to: '2026-06-01',
      active: true,
    },
    {
      id: 2,
      title: 'Angular Course',
      goal: 'Improve frontend development skills',
      description:
        'Complete an advanced Angular course focusing on performance optimization and architecture.',
      from: '2026-02-15',
      to: '2026-04-30',
      active: true,
    },
    {
      id: 3,
      title: 'Read Technical Books',
      goal: 'Expand knowledge in software engineering',
      description:
        'Read at least two books related to system design and scalable architecture.',
      from: '2026-01-10',
      to: '2026-05-10',
      active: false,
    },
    {
      id: 4,
      title: 'Spanish Study Group',
      goal: 'Practice Spanish communication',
      description:
        'Weekly meetup to practice speaking Spanish and improve fluency with native speakers.',
      from: '2026-03-05',
      to: '2026-07-01',
      active: true,
    },
    {
      id: 5,
      title: 'Gym Strength Training',
      goal: 'Build muscle and improve strength',
      description:
        'Structured strength training program focusing on compound lifts three times per week.',
      from: '2026-02-01',
      to: '2026-08-01',
      active: true,
    },
  ];

  constructor() {}
}
