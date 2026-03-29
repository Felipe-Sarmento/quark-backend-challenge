import { Injectable, Logger, NotFoundException } from '@nestjs/common';

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

  // Static database with ~10 known CNPJs
  // All other CNPJs return 404 (cache miss)
  private readonly database: Record<string, MockCompanyData> = {
    '11222333000181': {
      cnpj: '11222333000181',
      legalName: 'Empresa Alpha Tecnologia LTDA',
      partners: ['João Silva', 'Maria Santos'],
      addresses: ['Rua Principal, 100, São Paulo, SP 01234-567'],
      cnaes: ['6209100 - Suporte técnico, manutenção e outros serviços em tecnologia da informação'],
      foundedAt: '2015-06-15',
      phoneNumbers: ['+55 11 98765-4321'],
      emails: ['contato@alpha.com.br'],
    },
    '22333444000195': {
      cnpj: '22333444000195',
      legalName: 'Beta Consultoria Empresarial SA',
      partners: ['Carlos Mendes', 'Ana Costa'],
      addresses: ['Av. Paulista, 1000, São Paulo, SP 01311-100'],
      cnaes: ['6911201 - Consultoria em administração empresarial'],
      foundedAt: '2010-03-22',
      phoneNumbers: ['+55 11 3333-4444'],
      emails: ['info@beta.com.br'],
    },
    '33444555000109': {
      cnpj: '33444555000109',
      legalName: 'Gamma Logística e Distribuição LTDA',
      partners: ['Fernando Oliveira', 'Patricia Lima'],
      addresses: ['Rodovia BR-116, km 50, Rio de Janeiro, RJ 20000-000'],
      cnaes: ['4923100 - Serviço de transporte rodoviário de carga'],
      foundedAt: '2005-11-10',
      phoneNumbers: ['+55 21 98888-7777'],
      emails: ['logistica@gamma.com.br'],
    },
    '44555666000123': {
      cnpj: '44555666000123',
      legalName: 'Delta Manufatura Industrial SA',
      partners: ['Roberto Alves', 'Juliana Rocha'],
      addresses: ['Parque Industrial, lote 15, Belo Horizonte, MG 30140-000'],
      cnaes: ['2539100 - Fabricação de outros artigos de barro, cerâmica e porcelana'],
      foundedAt: '2008-05-18',
      phoneNumbers: ['+55 31 99999-1111'],
      emails: ['vendas@delta.com.br'],
    },
    '55666777000157': {
      cnpj: '55666777000157',
      legalName: 'Epsilon Soluções em TI LTDA',
      partners: ['Lucas Gomes', 'Sophia Ribeiro'],
      addresses: ['Sala 500, Ed. Tech Park, Porto Alegre, RS 90010-000'],
      cnaes: ['6204100 - Consultoria em tecnologia da informação'],
      foundedAt: '2018-02-14',
      phoneNumbers: ['+55 51 3333-5555'],
      emails: ['suporte@epsilon.com.br'],
    },
    '66777888000191': {
      cnpj: '66777888000191',
      legalName: 'Zeta Comércio Eletrônico SA',
      partners: ['Marcos Tavares', 'Beatriz Martins'],
      addresses: ['Centro Comercial, bloco A, Curitiba, PR 80000-000'],
      cnaes: ['4791000 - Comércio eletrônico'],
      foundedAt: '2012-09-25',
      phoneNumbers: ['+55 41 99988-2222'],
      emails: ['atendimento@zeta.com.br'],
    },
    '77888999000125': {
      cnpj: '77888999000125',
      legalName: 'Eta Consultores Associados LTDA',
      partners: ['Diego Ferreira', 'Natalia Souza'],
      addresses: ['Av. Brás de Pina, 500, Recife, PE 50000-000'],
      cnaes: ['6910100 - Atividades jurídicas'],
      foundedAt: '2016-07-03',
      phoneNumbers: ['+55 81 99777-3333'],
      emails: ['juridico@eta.com.br'],
    },
    '88999000000159': {
      cnpj: '88999000000159',
      legalName: 'Theta Serviços de Limpeza Industrial SA',
      partners: ['Paulo Teixeira', 'Carla Dias'],
      addresses: ['Quadra 10, lote 5, Brasília, DF 70000-000'],
      cnaes: ['8121700 - Limpeza em prédios e domicílios'],
      foundedAt: '2013-01-17',
      phoneNumbers: ['+55 61 99666-4444'],
      emails: ['comercial@theta.com.br'],
    },
    '99000111000193': {
      cnpj: '99000111000193',
      legalName: 'Iota Recursos Humanos e Recrutamento LTDA',
      partners: ['Isabela Mendes', 'Gustavo Oliveira'],
      addresses: ['Sala 1000, Ed. Corporate, Salvador, BA 40000-000'],
      cnaes: ['7810100 - Colocação e seleção de pessoal'],
      foundedAt: '2014-11-08',
      phoneNumbers: ['+55 71 99555-2222'],
      emails: ['rh@iota.com.br'],
    },
    '10111222000167': {
      cnpj: '10111222000167',
      legalName: 'Kappa Agronegócios e Consultoria Rural SA',
      partners: ['Eduardo Barbosa', 'Vanessa Oliveira'],
      addresses: ['Estrada Rural km 15, Goiânia, GO 70000-000'],
      cnaes: ['0161100 - Atividades de sementeira'],
      foundedAt: '2011-04-20',
      phoneNumbers: ['+55 62 99444-3333'],
      emails: ['agro@kappa.com.br'],
    },
  };

  enrichCompany(cnpj: string): MockCompanyData {
    this.logger.log(`Enriching company with CNPJ: ${cnpj}`);

    const companyData = this.database[cnpj];
    if (!companyData) {
      this.logger.warn(`CNPJ not found in mock database: ${cnpj}`);
      throw new NotFoundException(`Company with CNPJ ${cnpj} not found`);
    }

    return companyData;
  }
}
