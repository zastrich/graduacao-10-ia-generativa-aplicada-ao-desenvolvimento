/**
 * Mock local do S3 — armazena arquivos em memória para desenvolvimento.
 */

interface MockS3Object {
  key: string;
  body: Buffer;
  contentType: string;
  metadata: Record<string, string>;
  uploadedAt: string;
}

class MockS3 {
  private buckets: Map<string, Map<string, MockS3Object>> = new Map();

  constructor() {
    // Cria o bucket padrão
    this.buckets.set('conhecimento-ia-generativa-dev', new Map());
  }

  private getBucket(bucketName: string): Map<string, MockS3Object> {
    let bucket = this.buckets.get(bucketName);
    if (!bucket) {
      bucket = new Map();
      this.buckets.set(bucketName, bucket);
    }
    return bucket;
  }

  putObject(bucketName: string, key: string, body: Buffer, contentType = 'application/octet-stream', metadata: Record<string, string> = {}): void {
    const bucket = this.getBucket(bucketName);
    bucket.set(key, {
      key,
      body,
      contentType,
      metadata,
      uploadedAt: new Date().toISOString(),
    });
    console.log(`[MockS3] PUT ${bucketName}/${key} (${body.length} bytes)`);
  }

  getObject(bucketName: string, key: string): MockS3Object | undefined {
    const bucket = this.getBucket(bucketName);
    return bucket.get(key);
  }

  deleteObject(bucketName: string, key: string): boolean {
    const bucket = this.getBucket(bucketName);
    const existed = bucket.delete(key);
    console.log(`[MockS3] DELETE ${bucketName}/${key} (existed: ${existed})`);
    return existed;
  }

  listObjects(bucketName: string, prefix?: string): MockS3Object[] {
    const bucket = this.getBucket(bucketName);
    const objects = Array.from(bucket.values());
    if (prefix) {
      return objects.filter((obj) => obj.key.startsWith(prefix));
    }
    return objects;
  }

  deleteFolder(bucketName: string, prefix: string): number {
    const bucket = this.getBucket(bucketName);
    let count = 0;
    for (const key of bucket.keys()) {
      if (key.startsWith(prefix)) {
        bucket.delete(key);
        count++;
      }
    }
    console.log(`[MockS3] DELETE FOLDER ${bucketName}/${prefix} (${count} objects)`);
    return count;
  }
}

// Singleton
export const mockS3 = new MockS3();
