//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

// import { graphqlUploadExpress } from 'graphql-upload';
// import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';


async function bootstrap() {
  // const app = await NestFactory.create(AppModule);  // The OLD - BEFORE Adding AVATAR
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

//   app.enableCors({ origin: `https://${process.env.DOMAIN}`, credentials: true });
  app.enableCors({
	origin: [`https://nektak.com`, `https://www.nektak.com`, `http://localhost:3000`, `http://localhost`],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useStaticAssets(join(__dirname, '..', 'uploads')); 

  // app.use(graphqlUploadExpress());

  await app.listen(8080);
}
bootstrap();
