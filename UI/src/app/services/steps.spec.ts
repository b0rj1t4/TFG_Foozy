import { TestBed } from '@angular/core/testing';

import { Steps } from './steps';

describe('Steps', () => {
  let service: Steps;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Steps);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
