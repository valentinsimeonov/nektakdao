// src/aggregator/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // use `any` for simplicity and to avoid TS namespace/type issues with the import
  private client: any;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'redis';
    const port = Number(this.configService.get<number>('REDIS_PORT') || 6379);

    this.client = new Redis({ host, port, retryStrategy: (times: number) => Math.min(times * 50, 2000) });
    this.client.on('connect', () => this.logger.log(`Redis connected ${host}:${port}`));
    this.client.on('error', (err: any) => this.logger.error('Redis error', err?.message || err));
  }

  getClient(): any {
    return this.client;
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch (err) {
      // ignore
    }
  }
}


