//app/module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeormConfig } from './config/typeorm.config';
import { BullModule } from '@nestjs/bull';
import { bullConfig } from './config/bull.config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { graphqlConfig } from './config/graphql.config';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';

import { ProposalModule } from './proposal/proposal.module';



@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeormConfig),
    BullModule.forRootAsync(bullConfig),
    GraphQLModule.forRootAsync<ApolloDriverConfig>(graphqlConfig),
    ScheduleModule.forRoot(),

    ProposalModule,

	  ConfigModule.forRoot({
		isGlobal: true, 
		envFilePath: path.resolve(__dirname, '../../.env'),
	  }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}









// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { typeormConfig } from './config/typeorm.config';
// import { AggregatorModule } from './aggregator/aggregator.module';
// import { BullModule } from '@nestjs/bull';
// import { bullConfig } from './config/bull.config';
// import { GraphQLModule } from '@nestjs/graphql';
// import { ApolloDriverConfig } from '@nestjs/apollo';
// import { graphqlConfig } from './config/graphql.config';
// import { ScheduleModule } from '@nestjs/schedule';
// import { NewsModule } from './news/news.module';
// import { AuthModule } from './auth/auth.module';
// import { FirebaseModule } from 'nestjs-firebase';
// // import * as admin from 'firebase-admin';
// import firebaseAdmin from './auth/firebaseAdmin.instance';

// @Module({
//   imports: [
//     TypeOrmModule.forRootAsync(typeormConfig),
//     BullModule.forRootAsync(bullConfig),
//     GraphQLModule.forRootAsync<ApolloDriverConfig>(graphqlConfig),
//     ScheduleModule.forRoot(),
// 	FirebaseModule.forRootAsync({
// 		useFactory: () => {
// 			const firebaseApp = firebaseAdmin;
// 			return {};
// 		},
// 		}),
//     AuthModule,
//     AggregatorModule,
//     NewsModule,
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}



