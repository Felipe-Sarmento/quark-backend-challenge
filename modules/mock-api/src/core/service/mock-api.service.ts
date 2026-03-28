import { Injectable, Logger } from '@nestjs/common';

export interface MockCompanyData {
  cnpj: string;
  legalName: string;
  partners: string[];
  addresses: string[];
  cnaes: string[];
  foundedAt: string;
  phoneNumbers: string[];
  emails: string[];
}

@Injectable()
export class MockApiService {
  private readonly logger = new Logger(MockApiService.name);

  enrichCompany(cnpj: string): MockCompanyData {
    this.logger.log(`Enriching company with CNPJ: ${cnpj}`);

    // Return mock enrichment data
    return {
      cnpj,
      legalName: `Empresa LTDA ${cnpj.substring(0, 4)}`,
      partners: ['João Silva', 'Maria Santos'],
      addresses: [
        'Rua Principal, 100, São Paulo, SP 01234-567',
        'Rua Secundária, 200, Rio de Janeiro, RJ 20000-000',
      ],
      cnaes: ['6209100 - Suporte técnico, manutenção e outros serviços em tecnologia da informação'],
      foundedAt: '2015-06-15',
      phoneNumbers: ['+55 11 98765-4321', '+55 21 99999-8888'],
      emails: ['contato@empresa.com.br', 'vendas@empresa.com.br'],
    };
  }
}
