import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CreateChallengePage } from './create-challenge.page';

describe('CreateChallengePage', () => {
  let component: CreateChallengePage;
  let fixture: ComponentFixture<CreateChallengePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateChallengePage],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateChallengePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
