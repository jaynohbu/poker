import { createCorsOrigins } from './app.factory';

describe('createCorsOrigins', () => {
  it('trims and filters empty values', () => {
    const origins = createCorsOrigins(' http://a.com, ,http://b.com ,,  ');
    expect(origins).toEqual(['http://a.com', 'http://b.com']);
  });
});
