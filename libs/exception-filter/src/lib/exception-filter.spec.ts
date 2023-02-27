import { exceptionFilter } from './exception-filter';

describe('exceptionFilter', () => {
  it('should work', () => {
    expect(exceptionFilter()).toEqual('exception-filter');
  });
});
