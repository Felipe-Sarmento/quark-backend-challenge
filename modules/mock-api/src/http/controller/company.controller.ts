import { Controller, Get, Param, Logger } from '@nestjs/common';
import { MockApiService } from '../../core/service/mock-api.service';

@Controller('enrichment')
export class CompanyController {
  private readonly logger = new Logger(CompanyController.name);

  constructor(private mockApiService: MockApiService) {}

  @Get(':cnpj')
  enrichCompany(@Param('cnpj') cnpj: string) {
    this.logger.log(`Received enrichment request for CNPJ: ${cnpj}`);
    return this.mockApiService.enrichCompany(cnpj);
  }
}
