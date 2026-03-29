import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrichmentService } from '../enrichment.service';
import { Enrichment, EnrichmentStatus } from '@modules/lead';

describe('EnrichmentService', () => {
  let service: EnrichmentService;
  const mockPrisma = {
    enrichment: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EnrichmentService(mockPrisma as any);
  });

  describe('createEnrichmentRecord', () => {
    it('should create an enrichment record with PROCESSING status', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      const mockEnrichmentData = {
        id: 'enrichment-uuid-1',
        leadId,
        status: EnrichmentStatus.PROCESSING,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.enrichment.create.mockResolvedValue(mockEnrichmentData);

      // Act
      const result = await service.createEnrichmentRecord(leadId);

      // Assert
      expect(mockPrisma.enrichment.create).toHaveBeenCalledWith({
        data: {
          leadId,
          status: EnrichmentStatus.PROCESSING,
        },
      });
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
      const mockUpdatedData = {
        id: enrichmentId,
        leadId: 'lead-uuid-123',
        status: EnrichmentStatus.SUCCESS,
        completedAt,
        enrichmentData,
        createdAt: new Date(),
        updatedAt: completedAt,
      };
      mockPrisma.enrichment.update.mockResolvedValue(mockUpdatedData);

      // Act
      const result = await service.updateEnrichmentSuccess(enrichmentId, enrichmentData);

      // Assert
      expect(mockPrisma.enrichment.update).toHaveBeenCalledWith({
        where: { id: enrichmentId },
        data: {
          status: EnrichmentStatus.SUCCESS,
          completedAt: expect.any(Date),
          enrichmentData,
        },
      });
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
      const mockUpdatedData = {
        id: enrichmentId,
        leadId: 'lead-uuid-123',
        status: EnrichmentStatus.FAILED,
        completedAt,
        errorMessage,
        createdAt: new Date(),
        updatedAt: completedAt,
      };
      mockPrisma.enrichment.update.mockResolvedValue(mockUpdatedData);

      // Act
      const result = await service.updateEnrichmentError(enrichmentId, errorMessage);

      // Assert
      expect(mockPrisma.enrichment.update).toHaveBeenCalledWith({
        where: { id: enrichmentId },
        data: {
          status: EnrichmentStatus.FAILED,
          completedAt: expect.any(Date),
          errorMessage,
        },
      });
      expect(result).toBeInstanceOf(Enrichment);
      expect(result.status).toBe(EnrichmentStatus.FAILED);
      expect(result.errorMessage).toBe(errorMessage);
    });
  });

  describe('getLatestEnrichment', () => {
    it('should return the latest enrichment record for a lead', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      const mockEnrichmentData = {
        id: 'enrichment-uuid-1',
        leadId,
        status: EnrichmentStatus.SUCCESS,
        requestedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.enrichment.findFirst.mockResolvedValue(mockEnrichmentData);

      // Act
      const result = await service.getLatestEnrichment(leadId);

      // Assert
      expect(mockPrisma.enrichment.findFirst).toHaveBeenCalledWith({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBeInstanceOf(Enrichment);
      expect(result?.status).toBe(EnrichmentStatus.SUCCESS);
    });

    it('should return null when no enrichment record exists for a lead', async () => {
      // Arrange
      const leadId = 'lead-uuid-123';
      mockPrisma.enrichment.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.getLatestEnrichment(leadId);

      // Assert
      expect(mockPrisma.enrichment.findFirst).toHaveBeenCalledWith({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBeNull();
    });
  });
});
