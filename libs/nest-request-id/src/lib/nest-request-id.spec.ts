import { nestRequestId } from './nest-request-id';

describe('nestRequestId', () => {
  it('should work', () => {
    expect(nestRequestId()).toEqual('nest-request-id');
  });
});
