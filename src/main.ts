import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  app.setGlobalPrefix("api/v1")
  const configService = app.get(ConfigService);
  const port = configService?.get<number>("PORT", 5000)
  const corsOrigins = configService.get<string>("CORS_ORIGINS", "http://localhost:3000")
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({origin: corsOrigins})

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Resume Tailoring API')
    .setDescription('Backend API for Resume Tailoring API')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);
  await app.listen(port);
}
await bootstrap();