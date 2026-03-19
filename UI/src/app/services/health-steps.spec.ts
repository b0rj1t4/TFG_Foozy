import { TestBed } from '@angular/core/testing';

import { HealthSteps } from './health-steps';

describe('HealthSteps', () => {
  let service: HealthSteps;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HealthSteps);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
