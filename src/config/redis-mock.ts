export class MockRedisClient {
  public store: Map<string, string> = new Map();
  public connected = false;

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

  async setex(key: string, seconds: number, value: string): Promise<void> {
    console.log(`Mock Redis SETEX: ${key} = ${value} (TTL: ${seconds}s)`);
    this.store.set(key, value);
    // Note: Mock doesn't actually expire keys
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    return this.setex(key, seconds, value);
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    let deleted = 0;
    for (const k of keys) {
      if (this.store.has(k)) {
        this.store.delete(k);
        deleted++;
      }
    }
    console.log(`Mock Redis DEL: ${keys.join(', ')} (deleted: ${deleted})`);
    return deleted;
  }

  async expire(key: string, seconds: number): Promise<number> {
    console.log(`Mock Redis EXPIRE: ${key} (TTL: ${seconds}s)`);
    // Note: Mock doesn't actually expire keys
    return this.store.has(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    console.log(`Mock Redis EXISTS: ${key}`);
    return this.store.has(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    console.log(`Mock Redis KEYS: ${pattern}`);
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    console.log(`Mock Redis SADD: ${key} += ${members.join(', ')}`);
    const set = new Set<string>(JSON.parse(this.store.get(key) || '[]'));
    const initialSize = set.size;
    members.forEach(m => set.add(m));
    this.store.set(key, JSON.stringify(Array.from(set)));
    return set.size - initialSize;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    console.log(`Mock Redis SREM: ${key} -= ${members.join(', ')}`);
    const set = new Set<string>(JSON.parse(this.store.get(key) || '[]'));
    const initialSize = set.size;
    members.forEach(m => set.delete(m));
    this.store.set(key, JSON.stringify(Array.from(set)));
    return initialSize - set.size;
  }

  async smembers(key: string): Promise<string[]> {
    console.log(`Mock Redis SMEMBERS: ${key}`);
    return JSON.parse(this.store.get(key) || '[]');
  }

  on(event: string, callback: Function) {
    console.log(`Mock Redis event listener: ${event}`);
    if (event === 'connect') {
      setTimeout(() => callback(), 100);
    }
  }
}

export default new MockRedisClient();