//graphql.config.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GqlModuleAsyncOptions } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
// import { DateTimeResolver } from 'graphql-scalars'; 

export const graphqlConfig: GqlModuleAsyncOptions = {
  driver: ApolloDriver,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    subscriptions: {
      'graphql-ws': true,
      'subscriptions-transport-ws': true,
    },
    autoSchemaFile: 'src/schema.gql',
    buildSchemaOptions: {
      dateScalarMode: 'timestamp',
      // dateScalarMode: 'isoDate',

    },
    cors: {
      origin: `https://${configService.get('DOMAIN')}`,
      Credential: true,
    },
    debug: true, // TODO: remove for prod
    playground: true, // TODO: deprecated

  }),
};
