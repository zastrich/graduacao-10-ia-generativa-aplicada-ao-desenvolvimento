/**
 * S3 Service — abstrai acesso ao S3 usando mock local ou AWS SDK real.
 */

import { config } from '../utils/config';
import { mockS3 } from '../mocks/mockS3';

let s3Client: any = null;
let s3Commands: any = {};

async function getAWSClient() {
  if (config.isLocal) return null;

  if (!s3Client) {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: config.aws.region });
    s3Commands = { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand };
  }
  return s3Client;
}

export const s3Service = {
  async putObject(key: string, body: Buffer, contentType = 'application/octet-stream', metadata: Record<string, string> = {}): Promise<void> {
    const bucket = config.s3.knowledgeBucket;

    if (config.isLocal) {
      mockS3.putObject(bucket, key, body, contentType, metadata);
      return;
    }

    const client = await getAWSClient();
    await client.send(new s3Commands.PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    }));
  },

  async getObject(key: string): Promise<Buffer | null> {
    const bucket = config.s3.knowledgeBucket;

    if (config.isLocal) {
      const obj = mockS3.getObject(bucket, key);
      return obj ? obj.body : null;
    }

    const client = await getAWSClient();
    try {
      const result = await client.send(new s3Commands.GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of result.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err: any) {
      if (err.name === 'NoSuchKey') return null;
      throw err;
    }
  },

  async deleteObject(key: string): Promise<void> {
    const bucket = config.s3.knowledgeBucket;

    if (config.isLocal) {
      mockS3.deleteObject(bucket, key);
      return;
    }

    const client = await getAWSClient();
    await client.send(new s3Commands.DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
  },

  async listObjects(prefix: string): Promise<string[]> {
    const bucket = config.s3.knowledgeBucket;

    if (config.isLocal) {
      return mockS3.listObjects(bucket, prefix).map((obj) => obj.key);
    }

    const client = await getAWSClient();
    const result = await client.send(new s3Commands.ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    }));
    return (result.Contents || []).map((item: any) => item.Key);
  },

  async deleteFolder(prefix: string): Promise<void> {
    const bucket = config.s3.knowledgeBucket;

    if (config.isLocal) {
      mockS3.deleteFolder(bucket, prefix);
      return;
    }

    const keys = await this.listObjects(prefix);
    if (keys.length === 0) return;

    const client = await getAWSClient();
    await client.send(new s3Commands.DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    }));
  },
};
