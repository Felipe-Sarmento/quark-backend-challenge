import { Injectable } from '@nestjs/common';
import { ILeadRepository } from '../interface/lead.repository.interface';
import { LeadStatus } from '../entity/lead.entity';
import { Lead } from '../entity/lead.entity';
import { Enrichment } from '../entity/enrichment.entity';
import { Classification } from '../entity/classification.entity';

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

const BATCH_SIZE = 100;

@Injectable()
export class LeadExportService {
  constructor(private readonly leadRepository: ILeadRepository) {}

  private escapeCsvValue(value: unknown): string {
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

  private flattenToCsvRow(
    lead: LeadWithRelations,
  ): string {
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

    return values.map((v) => this.escapeCsvValue(v)).join(',');
  }

  async stream(
    status: LeadStatus | undefined,
    writer: any,
  ): Promise<void> {
    // Write header
    writer.write(CSV_HEADERS.join(',') + '\n');

    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const batch = (await this.leadRepository.exportBatch({
        status,
        cursor,
        take: BATCH_SIZE,
      })) as LeadWithRelations[];

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      // Write each lead as a CSV row
      for (const lead of batch) {
        const row = this.flattenToCsvRow(lead);
        writer.write(row + '\n');
      }

      // Update cursor to the last lead's id for next batch
      cursor = batch[batch.length - 1].id;

      // If we got fewer items than requested, we've reached the end
      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      }
    }
  }
}
