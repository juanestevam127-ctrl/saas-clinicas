import 'dotenv/config'; // MUST be first - loads .env before anything else
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança com Helmet
  app.use(helmet());

  // CORS configurado para aceitar requisições do frontend Next.js
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3001);
  console.log(`Backend rodando na porta ${process.env.PORT || 3001}`);
}
bootstrap();
