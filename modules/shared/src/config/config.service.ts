import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get isDevelopment(): boolean {
    return this.configService.get('NODE_ENV') === 'development';
  }

  get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  get rabbitmqUrl(): string {
    return this.configService.get<string>('RABBITMQ_URL');
  }

  get ollamaBaseUrl(): string {
    return this.configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11435');
  }

  get ollamaModel(): string {
    return this.configService.get<string>('OLLAMA_MODEL', 'tinyllama');
  }

  get mockApiUrl(): string {
    return this.configService.get<string>('MOCK_API_URL', 'http://localhost:3001');
  }

  get leadApiPort(): number {
    return this.configService.get<number>('LEAD_API_PORT', 3000);
  }

  get mockApiPort(): number {
    return this.configService.get<number>('MOCK_API_PORT', 3001);
  }
}
