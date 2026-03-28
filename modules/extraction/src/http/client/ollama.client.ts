import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@modules/shared';
import { firstValueFrom } from 'rxjs';

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

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
      const payload: OllamaRequest = {
        model: this.configService.ollamaModel,
        prompt,
        stream: false,
      };

      const response = await firstValueFrom(this.httpService.post<OllamaResponse>(url, payload));
      return response.data.response;
    } catch (error) {
      this.logger.error('Failed to classify with Ollama', error);
      throw error;
    }
  }
}
