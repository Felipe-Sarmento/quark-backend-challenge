import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { ConfigService } from './config.service';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    DATABASE_URL: z.string().min(1),
    RABBITMQ_URL: z.string().min(1),
    OLLAMA_BASE_URL: z.string().default('http://localhost:11435'),
    OLLAMA_MODEL: z.string().default('tinyllama'),
    MOCK_API_URL: z.string().default('http://localhost:3001'),
    LEAD_API_PORT: z.coerce.number().default(3000),
    MOCK_API_PORT: z.coerce.number().default(3001),
  })
  .passthrough();

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate(config: Record<string, unknown>) {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          throw new Error(result.error.toString());
        }
        return result.data;
      },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
