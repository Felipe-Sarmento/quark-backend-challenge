import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadService } from '../lead.service';
import { ILeadRepository } from '../../interface/lead.repository.interface';
import { Page } from '@modules/shared';
import { LeadStatus } from '../../entity/lead.entity';
import { makeLeadEntity } from '@test/fixtures/make-lead.helper';
import type { LeadCreationFields } from '../../entity/types';
import { LeadNotFoundException } from '../../exception/not-found.lead.exception';

describe('LeadService', () => {
  const mockRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as ILeadRepository;

  let service: LeadService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LeadService(mockRepository);
  });

  describe('create', () => {
    it('should create lead with PENDING status and return it', async () => {
      // Arrange
      const lead = makeLeadEntity({ status: LeadStatus.PENDING });
      (mockRepository.create as any).mockResolvedValue(lead);

      const creationData: LeadCreationFields = {
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        companyCnpj: lead.companyCnpj,
        companyWebsite: lead.companyWebsite,
        estimatedValue: lead.estimatedValue,
        source: lead.source,
        notes: lead.notes,
      };

      // Act
      const result = await service.create(creationData);

      // Assert
      expect(mockRepository.create).toHaveBeenCalled();
      const createdLead = (mockRepository.create as any).mock.calls[0][0];
      expect(createdLead.status).toBe(LeadStatus.PENDING);
      expect(result).toEqual(lead);
    });

    it('should re-throw when repository throws', async () => {
      // Arrange
      const creationData: LeadCreationFields = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        companyName: 'Acme Corp',
        companyCnpj: '12345678901234',
        source: 'WEBSITE',
      };

      (mockRepository.create as any).mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.create(creationData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should return lead when found', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockRepository.findById as any).mockResolvedValue(lead);

      // Act
      const result = await service.findById(lead.id!);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(lead.id);
      expect(result).toEqual(lead);
    });

    it('should throw NotFoundException when lead not found', async () => {
      // Arrange
      const leadId = 'nonexistent-id';
      (mockRepository.findById as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(leadId)).rejects.toThrow(
        LeadNotFoundException,
      );
      await expect(service.findById(leadId)).rejects.toThrow(
        /Lead with ID/,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return lead when found', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockRepository.findByEmail as any).mockResolvedValue(lead);

      // Act
      const result = await service.findByEmail(lead.email);

      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(lead.email);
      expect(result).toEqual(lead);
    });

    it('should throw NotFoundException when lead not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      (mockRepository.findByEmail as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByEmail(email)).rejects.toThrow(
        LeadNotFoundException,
      );
    });
  });

  describe('list', () => {
    it('should return paginated leads and total items count', async () => {
      // Arrange
      const lead1 = makeLeadEntity();
      const lead2 = makeLeadEntity();
      const page: Page = { skip: 0, take: 10 };
      const expected = {
        leads: [lead1, lead2],
        totalItems: 2,
      };
      (mockRepository.list as any).mockResolvedValue(expected);

      // Act
      const result = await service.list(page);

      // Assert
      expect(mockRepository.list).toHaveBeenCalledWith(page);
      expect(result).toEqual(expected);
      expect(result.leads).toHaveLength(2);
      expect(result.totalItems).toBe(2);
    });
  });

  describe('update', () => {
    it('should update lead with new data and return updated lead', async () => {
      // Arrange
      const lead = makeLeadEntity();
      const leadId = lead.id!;
      const updateData = {
        fullName: 'Jane Doe',
        phone: '9876543210',
      };

      const updatedLead = {
        ...lead,
        fullName: updateData.fullName,
        phone: updateData.phone,
        updatedAt: new Date(),
      };

      (mockRepository.update as any).mockResolvedValue(updatedLead);

      // Act
      const result = await service.update(leadId, updateData);

      // Assert
      expect(mockRepository.update).toHaveBeenCalled();
      const updateCall = (mockRepository.update as any).mock.calls[0][0];
      expect(updateCall.id).toBe(leadId);
      expect(updateCall.fullName).toBe(updateData.fullName);
      expect(updateCall.phone).toBe(updateData.phone);
      expect(updateCall.updatedAt).toBeDefined();
      expect(result).toEqual(updatedLead);
    });
  });

  describe('updateStatus', () => {
    it('should find lead, update status and return updated lead', async () => {
      // Arrange
      const lead = makeLeadEntity({ status: LeadStatus.PENDING });
      const leadId = lead.id!;
      const newStatus = LeadStatus.ENRICHING;

      const updatedLead = makeLeadEntity({
        id: lead.id,
        status: newStatus,
        updatedAt: new Date(),
      });

      (mockRepository.findById as any).mockResolvedValue(lead);
      (mockRepository.update as any).mockResolvedValue(updatedLead);

      // Act
      const result = await service.updateStatus(leadId, newStatus);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(leadId);
      expect(mockRepository.update).toHaveBeenCalled();
      const updateCall = (mockRepository.update as any).mock.calls[0][0];
      expect(updateCall.status).toBe(newStatus);
      expect(result).toEqual(updatedLead);
    });

    it('should throw NotFoundException when lead not found', async () => {
      // Arrange
      const leadId = 'nonexistent-id';
      const newStatus = LeadStatus.ENRICHING;
      (mockRepository.findById as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateStatus(leadId, newStatus),
      ).rejects.toThrow(LeadNotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete lead by id', async () => {
      // Arrange
      const leadId = 'lead-123';
      (mockRepository.delete as any).mockResolvedValue(undefined);

      // Act
      await service.delete(leadId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(leadId);
    });
  });
});
