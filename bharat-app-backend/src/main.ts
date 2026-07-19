import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global API Prefix
  app.setGlobalPrefix('api');

  // URI versioning (e.g. /api/v1/...). No `defaultVersion` is set, so every
  // existing controller (none of which declare a version) keeps resolving at
  // its current unversioned path — only controllers that opt in via
  // `@Controller({ version: '1' })` get the /v1 prefix. First used by the
  // Area Intelligence module.
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `🚀 Server is running on http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

bootstrap();
