// pubsub.provider.ts
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
// import { ConfigModule, ConfigService } from '@nestjs/config';

export const pubSub = new RedisPubSub({
  publisher: new Redis({
    host: 'redis',
    port: 6379,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  }),
  subscriber: new Redis({
    host: 'redis',
    port: 6379,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  }),
});


