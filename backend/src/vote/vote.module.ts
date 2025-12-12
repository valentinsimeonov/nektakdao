//vote.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PluginModule } from 'src/plugin/plugin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from '../proposal/redis.service';
import { VoteService} from 'src/vote/vote.service';
import { VoteResolver} from 'src/vote/vote.resolver';
import { pubSub } from '../config/pubsub.provider';

import { StagingReport } from '../entity/staging_report.entity';
import { Vote } from '../entity/vote.entity';
import { VoteStaging } from '../entity/vote_staging.entity';
import { Proposal } from 'src/entity/proposal.entity';



@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Vote, VoteStaging, Proposal]),
    // ScheduleModule,
    // PluginModule,
    // HttpModule,
  ],
  providers: [
    RedisService, 
    VoteService,
    {
      provide: 'PUB_SUB',
      useValue: pubSub,
    },
    VoteResolver,
  
    // VerificationService,
    // VerificationScheduler,
  
  
  ],
  exports: [VoteService,  RedisService],
})
export class VoteModule {}



