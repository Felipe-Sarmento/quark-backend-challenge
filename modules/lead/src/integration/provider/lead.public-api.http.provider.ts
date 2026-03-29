import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@modules/shared';
import { firstValueFrom } from 'rxjs';
import { Lead, LeadStatus } from '../../core/entity/lead.entity';
import { LeadPublicApi } from '../interface/lead.public-api.interface';
import { LeadResponse } from '../../http/response/lead.response';

/**
 * HTTP-based implementation of LeadPublicApi.
 * Makes HTTP requests to the lead API to fetch leads.
 * Currently unused — kept for future multi-service architecture.
 */
@Injectable()
export class LeadPublicApiHttpProvider implements LeadPublicApi {
  private readonly logger = new Logger(LeadPublicApiHttpProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getLeadOrThrow(id: string): Promise<Lead> {
    try {
      const url = `http://localhost:${this.configService.leadApiPort}/leads/${id}`;
      const response = await firstValueFrom(this.httpService.get<LeadResponse>(url));

      // Map HTTP response back to Lead entity
      return response.data.toDomain();
    } catch (error) {
      this.logger.error(`Failed to fetch lead ${id} from HTTP API`, error);
      throw error;
    }
  }

  async changeStatus(_id: string, _status: LeadStatus): Promise<void> {
    throw new Error('Not implemented for HTTP provider');
  }
}
