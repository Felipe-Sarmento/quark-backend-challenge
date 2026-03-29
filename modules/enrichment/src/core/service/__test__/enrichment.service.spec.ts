import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrichmentService } from '../enrichment.service';
import { Enrichment, EnrichmentStatus } from '@modules/lead';
import { IEnrichmentRepository } from '../../interface/enrichment.repository.interface';

describe('EnrichmentService', () => {
  let service: EnrichmentService;
  const mockRepository: Partial<IEnrichmentRepository> = {
    create: vi.fn(),
    updateSuccess: vi.fn(),
    updateError: vi.fn(),
    findLatestByLeadId: vi.fn(),
    listByLeadId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EnrichmentService(mockRepository as IEnrichmentRepository);
  });

  const createMockEnrichment = (overrides?: Partial<Enrichment>): Enrichment => {
    const enrichment = new Enrichment({
      id: 'enrichment-uuid-1',
      leadId: 'lead-uuid-123',
      status: EnrichmentStatus.PROCESSING,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return enrichment;
  };

  describe('createEnrichmentRecord', () => {
    it('should create an enrichment record with PROCESSING status', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      const mockEnrichment = createMockEnrichment({ leadId });
      (mockRepository.create as any).mockResolvedValue(mockEnrichment);

      // Act
      const result = await service.createEnrichmentRecord(leadId);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(leadId);
      expect(result).toBeInstanceOf(Enrichment);
      expect(result.status).toBe(EnrichmentStatus.PROCESSING);
      expect(result.leadId).toBe(leadId);
    });
  });

  describe('updateEnrichmentSuccess', () => {
    it('should update enrichment record with SUCCESS status and enrichment data', async () => {
      // Arrange
      const enrichmentId = 'enrichment-uuid-1';
      const enrichmentData = { cnpj: '12345678000195', legalName: 'Acme Corp' };
      const completedAt = new Date();
      const mockEnrichment = createMockEnrichment({
        id: enrichmentId,
        status: EnrichmentStatus.SUCCESS,
        completedAt,
        enrichmentData,
        updatedAt: completedAt,
      });
      (mockRepository.updateSuccess as any).mockResolvedValue(mockEnrichment);

      // Act
      const result = await service.updateEnrichmentSuccess(enrichmentId, enrichmentData);

      // Assert
      expect(mockRepository.updateSuccess).toHaveBeenCalledWith(enrichmentId, enrichmentData);
      expect(result).toBeInstanceOf(Enrichment);
      expect(result.status).toBe(EnrichmentStatus.SUCCESS);
      expect(result.enrichmentData).toEqual(enrichmentData);
    });
  });

  describe('updateEnrichmentError', () => {
    it('should update enrichment record with FAILED status and error message', async () => {
      // Arrange
      const enrichmentId = 'enrichment-uuid-1';
      const errorMessage = 'Company not found in database';
      const completedAt = new Date();
      const mockEnrichment = createMockEnrichment({
        id: enrichmentId,
        status: EnrichmentStatus.FAILED,
        completedAt,
        errorMessage,
        updatedAt: completedAt,
      });
      (mockRepository.updateError as any).mockResolvedValue(mockEnrichment);

      // Act
      const result = await service.updateEnrichmentError(enrichmentId, errorMessage);

      // Assert
      expect(mockRepository.updateError).toHaveBeenCalledWith(enrichmentId, errorMessage);
      expect(result).toBeInstanceOf(Enrichment);
      expect(result.status).toBe(EnrichmentStatus.FAILED);
      expect(result.errorMessage).toBe(errorMessage);
    });
  });

  describe('getLatestEnrichment', () => {
    it('should return the latest enrichment record for a lead', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      const mockEnrichment = createMockEnrichment({
        leadId,
        status: EnrichmentStatus.SUCCESS,
        completedAt: new Date(),
      });
      (mockRepository.findLatestByLeadId as any).mockResolvedValue(mockEnrichment);

      // Act
      const result = await service.getLatestEnrichment(leadId);

      // Assert
      expect(mockRepository.findLatestByLeadId).toHaveBeenCalledWith(leadId);
      expect(result).toBeInstanceOf(Enrichment);
      expect(result?.status).toBe(EnrichmentStatus.SUCCESS);
    });

    it('should return null when no enrichment record exists for a lead', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      (mockRepository.findLatestByLeadId as any).mockResolvedValue(null);

      // Act
      const result = await service.getLatestEnrichment(leadId);

      // Assert
      expect(mockRepository.findLatestByLeadId).toHaveBeenCalledWith(leadId);
      expect(result).toBeNull();
    });
  });

  describe('listByLeadId', () => {
    it('should return enrichments for a lead', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      const enrichmentA = createMockEnrichment({
        id: 'enrichment-uuid-1',
        leadId,
        status: EnrichmentStatus.SUCCESS,
        completedAt: new Date(),
      });
      const enrichmentB = createMockEnrichment({
        id: 'enrichment-uuid-2',
        leadId,
        status: EnrichmentStatus.PROCESSING,
      });
      (mockRepository.listByLeadId as any).mockResolvedValue([enrichmentA, enrichmentB]);

      // Act
      const result = await service.listByLeadId(leadId);

      // Assert
      expect(mockRepository.listByLeadId).toHaveBeenCalledWith(leadId);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Enrichment);
      expect(result[1]).toBeInstanceOf(Enrichment);
      expect(result[0]?.id).toBe(enrichmentA.id);
      expect(result[1]?.id).toBe(enrichmentB.id);
    });

    it('should return empty array when no enrichments exist for a lead', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      (mockRepository.listByLeadId as any).mockResolvedValue([]);

      // Act
      const result = await service.listByLeadId(leadId);

      // Assert
      expect(mockRepository.listByLeadId).toHaveBeenCalledWith(leadId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
