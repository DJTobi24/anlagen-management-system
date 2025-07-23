class MockRedisClient {
  private store: Map<string, string> = new Map();
  private connected = false;

  async connect() {
    this.connected = true;
    console.log('Mock Redis connected');
  }

  async quit() {
    this.connected = false;
    console.log('Mock Redis disconnected');
  }

  async get(key: string): Promise<string | null> {
    console.log(`Mock Redis GET: ${key}`);
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    console.log(`Mock Redis SET: ${key} = ${value}`);
    this.store.set(key, value);
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    const newValue = current + 1;
    this.store.set(key, newValue.toString());
    console.log(`Mock Redis INCR: ${key} = ${newValue}`);
    return newValue;
  }

  on(event: string, callback: Function) {
    console.log(`Mock Redis event listener: ${event}`);
    if (event === 'connect') {
      setTimeout(() => callback(), 100);
    }
  }
}

export default new MockRedisClient();