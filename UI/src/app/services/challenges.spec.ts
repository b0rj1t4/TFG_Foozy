import { TestBed } from '@angular/core/testing';

import { Challenges } from './challenges';

describe('Challenges', () => {
  let service: Challenges;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Challenges);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
