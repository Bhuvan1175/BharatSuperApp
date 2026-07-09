import { ValidationPipe } from '@nestjs/common';
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

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `🚀 Server is running on http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

bootstrap();