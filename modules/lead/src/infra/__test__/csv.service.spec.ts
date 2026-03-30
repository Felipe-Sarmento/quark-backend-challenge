import { describe, it } from 'vitest';
import { CsvService } from '../csv.service';

describe('CsvService', () => {
  let service: CsvService;

  beforeEach(() => {
    service = new CsvService();
  });

  describe('buildHeader', () => {
    it.todo('should return all 27 column names joined by commas ending with newline');
  });

  describe('toRow', () => {
    it.todo('should flatten lead fields into a comma-separated row');
    it.todo('should use empty strings when enrichment is absent');
    it.todo('should use empty strings when classification is absent');
    it.todo(
      'should use index 0 (latest) enrichment when multiple exist',
    );
    it.todo(
      'should use index 0 (latest) classification when multiple exist',
    );
    it.todo('should serialize enrichmentData as JSON string');
  });

  describe('escape (via toRow)', () => {
    it.todo('should wrap values containing commas in double quotes');
    it.todo(
      'should escape internal double quotes by doubling them',
    );
    it.todo(
      'should wrap values containing newlines in double quotes',
    );
    it.todo('should return empty string for null values');
    it.todo('should return empty string for undefined values');
  });
});
