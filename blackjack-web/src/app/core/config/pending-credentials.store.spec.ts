import { PendingCredentialsStore } from './pending-credentials.store';

describe('PendingCredentialsStore', () => {
  const store = new PendingCredentialsStore();

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and loads credentials', () => {
    store.set('a@a.com', 'password');
    expect(store.get()).toEqual({ email: 'a@a.com', password: 'password' });
  });

  it('clears credentials', () => {
    store.set('a@a.com', 'password');
    store.clear();
    expect(store.get()).toBeNull();
  });
});
