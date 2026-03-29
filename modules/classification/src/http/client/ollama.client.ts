import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@modules/shared';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async classify(prompt: string): Promise<string> {
    try {
      const url = `${this.configService.ollamaBaseUrl}/api/generate`;
      const response = await firstValueFrom(
        this.httpService.post<{ response: string }>(url, {
          model: this.configService.ollamaModel,
          prompt,
          stream: false,
        }),
      );
      return response.data.response;
    } catch (error) {
      this.logger.error('Failed to classify with Ollama', error);
      throw error;
    }
  }
}
