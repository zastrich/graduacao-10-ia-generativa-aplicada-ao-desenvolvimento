/**
 * DynamoDB Service — abstrai acesso ao DynamoDB usando mock local ou AWS SDK real.
 */

import { config } from '../utils/config';
import { mockDynamoDB } from '../mocks/mockDynamoDB';

// Imports condicionais do AWS SDK (só carregados em produção)
let dynamoDBClient: any = null;
let DynamoDBDocumentClient: any = null;
let dynamoCommands: any = {};

async function getAWSClient() {
  if (config.isLocal) return null;
  
  if (!dynamoDBClient) {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const docClient = await import('@aws-sdk/lib-dynamodb');
    const client = new DynamoDBClient({ region: config.aws.region });
    dynamoDBClient = docClient.DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
    dynamoCommands = docClient;
  }
  return dynamoDBClient;
}

export const dynamoService = {
  async put(tableName: string, item: Record<string, any>): Promise<Record<string, any>> {
    if (config.isLocal) {
      return mockDynamoDB.getTable(tableName).put(item);
    }

    const client = await getAWSClient();
    await client.send(new dynamoCommands.PutCommand({
      TableName: tableName,
      Item: item,
    }));
    return item;
  },

  async get(tableName: string, key: Record<string, string>): Promise<Record<string, any> | undefined> {
    if (config.isLocal) {
      return mockDynamoDB.getTable(tableName).get(key);
    }

    const client = await getAWSClient();
    const result = await client.send(new dynamoCommands.GetCommand({
      TableName: tableName,
      Key: key,
    }));
    return result.Item;
  },

  async query(tableName: string, keyCondition: Record<string, string>, indexName?: string): Promise<Record<string, any>[]> {
    if (config.isLocal) {
      return mockDynamoDB.getTable(tableName).query(keyCondition, indexName);
    }

    const client = await getAWSClient();
    const keyName = Object.keys(keyCondition)[0];
    const allItems: Record<string, any>[] = [];
    let lastKey: any = undefined;

    do {
      const result = await client.send(new dynamoCommands.QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: `#key = :value`,
        ExpressionAttributeNames: { '#key': keyName },
        ExpressionAttributeValues: { ':value': keyCondition[keyName] },
        ExclusiveStartKey: lastKey,
      }));
      allItems.push(...(result.Items || []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return allItems;
  },

  async scan(tableName: string): Promise<Record<string, any>[]> {
    if (config.isLocal) {
      return mockDynamoDB.getTable(tableName).scan();
    }

    const client = await getAWSClient();
    const allItems: Record<string, any>[] = [];
    let lastKey: any = undefined;

    do {
      const result = await client.send(new dynamoCommands.ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
      }));
      allItems.push(...(result.Items || []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return allItems;
  },

  async update(tableName: string, key: Record<string, string>, updates: Record<string, any>): Promise<Record<string, any> | undefined> {
    if (config.isLocal) {
      return mockDynamoDB.getTable(tableName).update(key, updates);
    }

    const client = await getAWSClient();
    const updateKeys = Object.keys(updates);
    const updateExpression = 'SET ' + updateKeys.map((k, i) => `#attr${i} = :val${i}`).join(', ');
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    updateKeys.forEach((k, i) => {
      expressionAttributeNames[`#attr${i}`] = k;
      expressionAttributeValues[`:val${i}`] = updates[k];
    });

    const result = await client.send(new dynamoCommands.UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes;
  },

  /**
   * Atomically appends an item to a list attribute and increments a counter.
   * Safe for concurrent writes (no read-modify-write race condition).
   */
  async appendToList(
    tableName: string,
    key: Record<string, string>,
    listAttr: string,
    item: any,
    counterAttr?: string
  ): Promise<Record<string, any> | undefined> {
    if (config.isLocal) {
      // Mock: simple read-modify-write (no concurrency locally)
      const record = await mockDynamoDB.getTable(tableName).get(key);
      if (!record) return undefined;
      const list = record[listAttr] || [];
      list.push(item);
      record[listAttr] = list;
      if (counterAttr) record[counterAttr] = list.length;
      record.updatedAt = new Date().toISOString();
      return mockDynamoDB.getTable(tableName).put(record);
    }

    const client = await getAWSClient();
    let updateExpression = `SET #list = list_append(if_not_exists(#list, :emptyList), :newItem), #updatedAt = :now`;
    const expressionAttributeNames: Record<string, string> = {
      '#list': listAttr,
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':newItem': [item],
      ':emptyList': [],
      ':now': new Date().toISOString(),
    };

    if (counterAttr) {
      updateExpression += ` ADD #counter :one`;
      expressionAttributeNames['#counter'] = counterAttr;
      expressionAttributeValues[':one'] = 1;
    }

    const result = await client.send(new dynamoCommands.UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes;
  },

  async delete(tableName: string, key: Record<string, string>): Promise<boolean> {
    if (config.isLocal) {
      return mockDynamoDB.getTable(tableName).delete(key);
    }

    const client = await getAWSClient();
    await client.send(new dynamoCommands.DeleteCommand({
      TableName: tableName,
      Key: key,
    }));
    return true;
  },
};
