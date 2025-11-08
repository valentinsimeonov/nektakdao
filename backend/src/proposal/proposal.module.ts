//proposal.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PluginModule } from 'src/plugin/plugin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from './redis.service';
import { Proposal } from 'src/entity/proposal.entity';
import { ProposalService} from 'src/proposal/proposal.service';
import { ProposalResolver} from 'src/proposal/proposal.resolver';
import { pubSub } from '../config/pubsub.provider';


@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Proposal]),
    ScheduleModule,
    PluginModule,
    HttpModule,
  ],
  providers: [
    RedisService, 
    ProposalService,
    {
      provide: 'PUB_SUB',
      useValue: pubSub,
    },


    ProposalResolver,
  ],
  exports: [ProposalService,  RedisService],
})
export class ProposalModule {}



