//typeorm.config.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { Proposal } from '../entity/proposal.entity';
import { StagingReport } from '../entity/staging_report.entity';
import { VoteStaging } from 'src/entity/vote_staging.entity';
import { Vote } from 'src/entity/vote.entity';


export const typeormConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [Proposal, StagingReport, Vote, VoteStaging],
    synchronize: true,
  }),
};


