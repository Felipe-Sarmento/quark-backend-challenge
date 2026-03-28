import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@modules/shared';
import { firstValueFrom } from 'rxjs';

export interface CompanyEnrichmentData {
  cnpj: string;
  legalName: string;
  partners?: string[];
  addresses?: string[];
  cnaes?: string[];
  foundedAt?: string;
  phoneNumbers?: string[];
  emails?: string[];
  [key: string]: unknown;
}

@Injectable()
export class MockApiClient {
  private readonly logger = new Logger(MockApiClient.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async enrichCompany(cnpj: string): Promise<CompanyEnrichmentData> {
    try {
      const url = `${this.configService.mockApiUrl}/enrichment/${cnpj}`;
      const response = await firstValueFrom(this.httpService.get<CompanyEnrichmentData>(url));
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to enrich company ${cnpj}`, error);
      throw error;
    }
  }
}
