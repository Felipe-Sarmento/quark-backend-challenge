import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadPrismaRepository } from '../lead.prisma.repository';
import { Lead } from '../../core/entity/lead.entity';
import { PrismaService, Page } from '@modules/shared';
import { LeadAlreadyExistsException } from '../../core/exception/already-exists.lead.exception';
import { LeadNotFoundException } from '../../core/exception/not-found.lead.exception';
import { ConflictLeadException } from '../../core/exception/conflict.lead.exception';
import { makeLeadEntity } from '@test/fixtures/make-lead.helper';

// Type placeholder for PrismaService
type PrismaServiceMock = any;

describe('LeadPrismaRepository', () => {
  const mockPrisma = {
    lead: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaServiceMock;

  let repository: LeadPrismaRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new LeadPrismaRepository(mockPrisma as unknown as PrismaService);
  });

  const makeLeadRecord = (lead = makeLeadEntity()) => ({
    id: lead.id,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    companyCnpj: lead.companyCnpj,
    companyWebsite: lead.companyWebsite,
    estimatedValue: lead.estimatedValue,
    source: lead.source,
    notes: lead.notes,
    status: lead.status,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  });

  describe('create', () => {
    it('should save lead and return a Lead entity', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockPrisma.lead.create as any).mockResolvedValue(makeLeadRecord(lead));

      // Act
      const result = await repository.create(lead);

      // Assert
      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: {
          id: lead.id,
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.companyName,
          companyCnpj: lead.companyCnpj,
          companyWebsite: lead.companyWebsite,
          estimatedValue: lead.estimatedValue,
          source: lead.source,
          notes: lead.notes,
          status: lead.status,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        },
      });
      expect(result).toBeInstanceOf(Lead);
      expect(result.id).toBe(lead.id);
    });

    it('should throw LeadAlreadyExistsException when email is duplicate (P2002)', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockPrisma.lead.create as any).mockRejectedValue({
        code: 'P2002',
      });

      // Act & Assert
      await expect(repository.create(lead)).rejects.toThrow(
        LeadAlreadyExistsException,
      );
    });

    it('should re-throw unknown errors', async () => {
      // Arrange
      const lead = makeLeadEntity();
      const dbError = new Error('DB connection failed');
      (mockPrisma.lead.create as any).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.create(lead)).rejects.toThrow('DB connection failed');
    });
  });

  describe('findById', () => {
    it('should return Lead when found', async () => {
      // Arrange
      const lead = makeLeadEntity();
      const leadId = lead.id!;
      (mockPrisma.lead.findUnique as any).mockResolvedValue(makeLeadRecord(lead));

      // Act
      const result = await repository.findById(leadId);

      // Assert
      expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith({
        where: { id: leadId },
      });
      expect(result).toBeInstanceOf(Lead);
      expect(result?.id).toBe(leadId);
    });

    it('should return null when not found', async () => {
      // Arrange
      const leadId = 'nonexistent-id';
      (mockPrisma.lead.findUnique as any).mockResolvedValue(null);

      // Act
      const result = await repository.findById(leadId);

      // Assert
      expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith({
        where: { id: leadId },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return Lead when found', async () => {
      // Arrange
      const lead = makeLeadEntity();
      const email = lead.email;
      (mockPrisma.lead.findUnique as any).mockResolvedValue(makeLeadRecord(lead));

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeInstanceOf(Lead);
      expect(result?.email).toBe(email);
    });

    it('should return null when not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      (mockPrisma.lead.findUnique as any).mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return mapped leads and totalItems', async () => {
      // Arrange
      const page = Page.create(1, 10);
      const lead = makeLeadEntity();
      (mockPrisma.lead.findMany as any).mockResolvedValue([makeLeadRecord(lead)]);
      (mockPrisma.lead.count as any).mockResolvedValue(1);

      // Act
      const result = await repository.list(page);

      // Assert
      expect(result.leads).toHaveLength(1);
      expect(result.leads[0]).toBeInstanceOf(Lead);
      expect(result.totalItems).toBe(1);
    });

    it('should return empty array when no leads exist', async () => {
      // Arrange
      const page = Page.create(1, 10);
      (mockPrisma.lead.findMany as any).mockResolvedValue([]);
      (mockPrisma.lead.count as any).mockResolvedValue(0);

      // Act
      const result = await repository.list(page);

      // Assert
      expect(result.leads).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });

    it('should pass skip=0 and take=10 for page 1 with size 10', async () => {
      // Arrange
      const page = Page.create(1, 10);
      (mockPrisma.lead.findMany as any).mockResolvedValue([]);
      (mockPrisma.lead.count as any).mockResolvedValue(0);

      // Act
      await repository.list(page);

      // Assert
      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should pass skip=10 and take=10 for page 2 with size 10', async () => {
      // Arrange
      const page = Page.create(2, 10);
      (mockPrisma.lead.findMany as any).mockResolvedValue([]);
      (mockPrisma.lead.count as any).mockResolvedValue(0);

      // Act
      await repository.list(page);

      // Assert
      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should pass skip=20 and take=5 for page 5 with size 5', async () => {
      // Arrange
      const page = Page.create(5, 5);
      (mockPrisma.lead.findMany as any).mockResolvedValue([]);
      (mockPrisma.lead.count as any).mockResolvedValue(0);

      // Act
      await repository.list(page);

      // Assert
      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update lead and return a Lead entity', async () => {
      // Arrange
      const lead = makeLeadEntity({ fullName: 'Updated Name' });
      (mockPrisma.lead.update as any).mockResolvedValue(makeLeadRecord(lead));

      // Act
      const result = await repository.update(lead);

      // Assert
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: lead.id },
        data: expect.objectContaining({
          fullName: 'Updated Name',
          email: lead.email,
        }),
      });
      expect(result).toBeInstanceOf(Lead);
      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw LeadNotFoundException when lead not found (P2025)', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockPrisma.lead.update as any).mockRejectedValue({
        code: 'P2025',
      });

      // Act & Assert
      await expect(repository.update(lead)).rejects.toThrow(
        LeadNotFoundException,
      );
    });

    it('should throw ConflictLeadException with field name when email is duplicate (P2002)', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockPrisma.lead.update as any).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      // Act & Assert
      await expect(repository.update(lead)).rejects.toThrow(
        ConflictLeadException,
      );
      await expect(repository.update(lead)).rejects.toThrow(/email/);
    });

    it('should throw ConflictLeadException with fallback field when meta.target is missing (P2002)', async () => {
      // Arrange
      const lead = makeLeadEntity();
      (mockPrisma.lead.update as any).mockRejectedValue({
        code: 'P2002',
        meta: {},
      });

      // Act & Assert
      await expect(repository.update(lead)).rejects.toThrow(
        ConflictLeadException,
      );
      await expect(repository.update(lead)).rejects.toThrow(/field/);
    });

    it('should re-throw unknown errors', async () => {
      // Arrange
      const lead = makeLeadEntity();
      const dbError = new Error('DB connection failed');
      (mockPrisma.lead.update as any).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.update(lead)).rejects.toThrow('DB connection failed');
    });
  });

  describe('delete', () => {
    it('should call prisma.lead.delete with correct id', async () => {
      // Arrange
      const leadId = 'lead-1';
      (mockPrisma.lead.delete as any).mockResolvedValue({});

      // Act
      await repository.delete(leadId);

      // Assert
      expect(mockPrisma.lead.delete).toHaveBeenCalledWith({
        where: { id: leadId },
      });
    });

    it('should throw LeadNotFoundException when lead not found (P2025)', async () => {
      // Arrange
      const leadId = 'nonexistent-id';
      (mockPrisma.lead.delete as any).mockRejectedValue({
        code: 'P2025',
      });

      // Act & Assert
      await expect(repository.delete(leadId)).rejects.toThrow(
        LeadNotFoundException,
      );
      await expect(repository.delete(leadId)).rejects.toThrow(/nonexistent-id/);
    });
  });
});
