import { Injectable } from '@nestjs/common';
import { Lead } from '../core/entity/lead.entity';
import { Enrichment } from '../core/entity/enrichment.entity';
import { Classification } from '../core/entity/classification.entity';

interface LeadWithRelations extends Lead {
  enrichments: Enrichment[];
  classifications: Classification[];
}

const CSV_HEADERS = [
  'id',
  'fullName',
  'email',
  'phone',
  'companyName',
  'companyCnpj',
  'companyWebsite',
  'estimatedValue',
  'source',
  'notes',
  'status',
  'createdAt',
  'updatedAt',
  'enrichment_status',
  'enrichment_requestedAt',
  'enrichment_completedAt',
  'enrichment_errorMessage',
  'enrichment_data',
  'classification_status',
  'classification_score',
  'classification_level',
  'classification_commercialPotential',
  'classification_justification',
  'classification_modelUsed',
  'classification_requestedAt',
  'classification_completedAt',
  'classification_errorMessage',
];

@Injectable()
export class CsvService {
  private escape(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  toRow(lead: LeadWithRelations): string {
    const latestEnrichment = lead.enrichments?.[0];
    const latestClassification = lead.classifications?.[0];

    const values = [
      lead.id,
      lead.fullName,
      lead.email,
      lead.phone,
      lead.companyName,
      lead.companyCnpj,
      lead.companyWebsite,
      lead.estimatedValue,
      lead.source,
      lead.notes,
      lead.status,
      lead.createdAt.toISOString(),
      lead.updatedAt.toISOString(),
      latestEnrichment?.status || '',
      latestEnrichment?.requestedAt?.toISOString() || '',
      latestEnrichment?.completedAt?.toISOString() || '',
      latestEnrichment?.errorMessage || '',
      latestEnrichment?.enrichmentData
        ? JSON.stringify(latestEnrichment.enrichmentData)
        : '',
      latestClassification?.status || '',
      latestClassification?.score ?? '',
      latestClassification?.classification || '',
      latestClassification?.commercialPotential || '',
      latestClassification?.justification || '',
      latestClassification?.modelUsed || '',
      latestClassification?.requestedAt?.toISOString() || '',
      latestClassification?.completedAt?.toISOString() || '',
      latestClassification?.errorMessage || '',
    ];

    return values.map((v) => this.escape(v)).join(',');
  }

  buildHeader(): string {
    return CSV_HEADERS.join(',') + '\n';
  }
}
