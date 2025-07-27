import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Import Swagger modules

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // Enable CORS for the frontend
  app.enableCors({
    origin: '*', // Allow all origins for development, restrict in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Use Socket.IO adapter for WebSockets
  app.useWebSocketAdapter(new IoAdapter(app));

  // --- Swagger UI Setup ---
  const config = new DocumentBuilder()
    .setTitle('Ad Campaign API')
    .setDescription('API for fetching and managing Ad Campaign data with real-time updates.')
    .setVersion('1.0')
    .addBearerAuth( // Add bearer token for authentication if needed in future
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 'api' is the path where Swagger UI will be available (e.g., http://localhost:5000/api)
  // --- End Swagger UI Setup ---

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000; // Changed default port to 5000
  await app.listen(port);
  console.log(`Nest.js backend listening on port ${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api`);
}
bootstrap();