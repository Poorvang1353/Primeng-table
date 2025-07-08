import { TestBed } from '@angular/core/testing';

import { PrimengTableService } from './primeng-table.service';

describe('PrimengTableService', () => {
  let service: PrimengTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrimengTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
