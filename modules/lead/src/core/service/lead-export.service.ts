import { Injectable, Inject } from '@nestjs/common';
import { ILeadRepository } from '../interface/lead.repository.interface';
import { LeadStatus } from '../entity/lead.entity';
import { CsvService } from '../../infra/csv.service';

const BATCH_SIZE = 100;

@Injectable()
export class LeadExportService {
  constructor(
    @Inject(ILeadRepository)
    private readonly leadRepository: ILeadRepository,
    private readonly csvService: CsvService,
  ) {}

  async stream(
    status: LeadStatus | undefined,
    writer: any,
  ): Promise<void> {
    // Write header
    writer.write(this.csvService.buildHeader());

    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.leadRepository.exportBatch({
        status,
        cursor,
        take: BATCH_SIZE,
      });

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      // Write each lead as a CSV row
      for (const lead of batch) {
        const row = this.csvService.toRow(lead);
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
