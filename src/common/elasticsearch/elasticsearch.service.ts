import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE, // Load from your environment configuration
    });
  }

  async onModuleInit() {
    const indexExists = await this.indexExists(process.env.ELASTICSEARCH_INDEX);
    if (!indexExists) {
      await this.createIndex(process.env.ELASTICSEARCH_INDEX, {
        mappings: {
          properties: {
            question: { type: 'text' },
            createdAt: { type: 'date' },
            createdBy: { type: 'integer' },
          },
        },
      });
    }
  }

  async createIndex(index: string, body: any) {
    return this.client.indices.create({
      index,
      body,
    });
  }

  async indexExists(index: string) {
    const exists = await this.client.indices.exists({ index });
  return exists; 
  }

  async indexDocument(index: string, id: string, document: any) {
    return this.client.index({
      index,
      id,
      body: document,
    });
  }

  async search(index: string, query: any) {
    return this.client.search({
      index,
      body: query,
    });
  }
}
