interface MockQueryResult {
  rows: any[];
  rowCount: number;
}

class MockPool {
  private isConnected = false;

  async query(text: string, params?: any[]): Promise<MockQueryResult> {
    console.log(`Mock DB Query: ${text}`, params ? `Params: ${JSON.stringify(params)}` : '');
    
    if (text.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }], rowCount: 1 };
    }
    
    if (text.includes('migrations')) {
      return { rows: [], rowCount: 0 };
    }
    
    return { rows: [], rowCount: 0 };
  }

  async connect() {
    return {
      query: this.query.bind(this),
      release: () => console.log('Mock connection released')
    };
  }

  async end() {
    this.isConnected = false;
    console.log('Mock database connection ended');
  }
}

export default new MockPool();