import { describe, it, beforeEach, vi } from 'vitest';
import { LeadExportService } from '../lead-export.service';
import { ILeadRepository } from '../../interface/lead.repository.interface';
import { CsvService } from '../../../infra/csv.service';

describe('LeadExportService', () => {
  const mockRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exportBatch: vi.fn(),
  } as unknown as ILeadRepository;

  const csvService = new CsvService();

  let service: LeadExportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LeadExportService(mockRepository, csvService);
  });

  describe('stream', () => {
    it.todo('should write CSV header before any rows');
    it.todo('should write one row per lead in the batch');
    it.todo('should stop iteration when batch is empty');
    it.todo(
      'should stop iteration when batch size is less than BATCH_SIZE',
    );
    it.todo('should pass cursor from last item to next batch call');
    it.todo('should filter leads by status when provided');
    it.todo('should export all leads when status is undefined');
  });
});
