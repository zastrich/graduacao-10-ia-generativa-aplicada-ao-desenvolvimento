/**
 * Mock local do DynamoDB — armazena dados em memória para desenvolvimento.
 * Simula as operações básicas: put, get, query, scan, update, delete.
 */

type Item = Record<string, any>;

interface TableConfig {
  keySchema: { hashKey: string; rangeKey?: string };
  gsiIndexes?: Record<string, { hashKey: string }>;
}

class MockTable {
  private items: Item[] = [];
  private config: TableConfig;

  constructor(config: TableConfig) {
    this.config = config;
  }

  put(item: Item): Item {
    const existingIndex = this.items.findIndex(
      (existing) => existing[this.config.keySchema.hashKey] === item[this.config.keySchema.hashKey] &&
        (!this.config.keySchema.rangeKey || existing[this.config.keySchema.rangeKey] === item[this.config.keySchema.rangeKey])
    );

    if (existingIndex >= 0) {
      this.items[existingIndex] = { ...item };
    } else {
      this.items.push({ ...item });
    }
    return item;
  }

  get(key: Record<string, string>): Item | undefined {
    return this.items.find((item) => {
      const hashMatch = item[this.config.keySchema.hashKey] === key[this.config.keySchema.hashKey];
      if (!this.config.keySchema.rangeKey) return hashMatch;
      return hashMatch && item[this.config.keySchema.rangeKey!] === key[this.config.keySchema.rangeKey!];
    });
  }

  query(keyCondition: Record<string, string>, indexName?: string): Item[] {
    if (indexName && this.config.gsiIndexes?.[indexName]) {
      const gsiHashKey = this.config.gsiIndexes[indexName].hashKey;
      return this.items.filter((item) => item[gsiHashKey] === keyCondition[gsiHashKey]);
    }

    const hashKey = this.config.keySchema.hashKey;
    return this.items.filter((item) => item[hashKey] === keyCondition[hashKey]);
  }

  scan(): Item[] {
    return [...this.items];
  }

  update(key: Record<string, string>, updates: Partial<Item>): Item | undefined {
    const item = this.get(key);
    if (!item) return undefined;
    Object.assign(item, updates);
    return item;
  }

  delete(key: Record<string, string>): boolean {
    const index = this.items.findIndex((item) => {
      const hashMatch = item[this.config.keySchema.hashKey] === key[this.config.keySchema.hashKey];
      if (!this.config.keySchema.rangeKey) return hashMatch;
      return hashMatch && item[this.config.keySchema.rangeKey!] === key[this.config.keySchema.rangeKey!];
    });

    if (index >= 0) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.items = [];
  }
}

class MockDynamoDB {
  private tables: Map<string, MockTable> = new Map();

  constructor() {
    // Inicializa tabelas com seus schemas
    this.tables.set('knowledge-bases', new MockTable({
      keySchema: { hashKey: 'id' },
      gsiIndexes: { 'slug-index': { hashKey: 'slug' } },
    }));

    this.tables.set('conversations', new MockTable({
      keySchema: { hashKey: 'id' },
      gsiIndexes: {
        'userUid-index': { hashKey: 'userUid' },
        'knowledgeBase-index': { hashKey: 'knowledgeBaseId' },
      },
    }));

    this.tables.set('messages', new MockTable({
      keySchema: { hashKey: 'conversationId', rangeKey: 'createdAt' },
    }));

    this.tables.set('users', new MockTable({
      keySchema: { hashKey: 'id' },
      gsiIndexes: { 'email-index': { hashKey: 'email' } },
    }));
  }

  getTable(tableName: string): MockTable {
    // Normaliza o nome da tabela (remove prefixo/sufixo de stage)
    const normalizedName = tableName
      .replace(/^copiloto-/, '')
      .replace(/-dev$|-staging$|-prod$/, '');

    const table = this.tables.get(normalizedName);
    if (!table) {
      throw new Error(`Mock table not found: ${tableName} (normalized: ${normalizedName})`);
    }
    return table;
  }
}

// Singleton
export const mockDynamoDB = new MockDynamoDB();
