import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { LeadController, LeadService, LeadPublicApi } from '../../../index';
import { ILeadRepository } from '../../../core/interface/lead.repository.interface';
import { LeadPrismaRepository } from '../../../persistence/lead.prisma.repository';
import { EnrichmentJobQueueProducer } from '../../../queue/producer/enrichment-job.queue-producer';
import { PrismaModule, PrismaService, HttpExceptionFilter } from '@modules/shared';
import { LeadEnrichmentController, EnrichmentService } from '@modules/enrichment';
import { NotFoundException } from '@nestjs/common';

describe('LeadController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  faker.seed(42);

  beforeAll(async () => {
    const mockEnrichmentJobQueueProducer = {
      triggerEnrichment: vi.fn().mockResolvedValue(undefined),
    };

    const mockLeadPublicApi = {
      getLeadOrThrow: vi.fn().mockImplementation(async (id: string) => {
        const lead = await prisma?.lead.findUnique({ where: { id } });
        if (!lead) throw new NotFoundException(`Lead with id ${id} not found`);
        return lead;
      }),
    };

    const mockEnrichmentService = {
      listByLeadId: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [LeadController, LeadEnrichmentController],
      providers: [
        LeadService,
        {
          provide: ILeadRepository,
          useClass: LeadPrismaRepository,
        },
        {
          provide: EnrichmentJobQueueProducer,
          useValue: mockEnrichmentJobQueueProducer,
        },
        {
          provide: LeadPublicApi,
          useValue: mockLeadPublicApi,
        },
        {
          provide: EnrichmentService,
          useValue: mockEnrichmentService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = module.get(PrismaService);

    // Ensure clean state before suite starts (prevents flake from previous interrupted runs)
    await prisma.lead.deleteMany();
  });

  afterAll(async () => {
    await prisma.lead.deleteMany();
    await app.close();
  });

  afterEach(async () => {
    await prisma.lead.deleteMany();
    vi.clearAllMocks();
  });

  describe('POST /leads', () => {
    it('should create lead with all fields and return 200 with created lead', async () => {
      // Arrange
      const createLeadDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        companyWebsite: faker.internet.url(),
        estimatedValue: faker.number.float({ min: 1000, max: 1_000_000, fractionDigits: 2 }),
        source: 'WEBSITE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(createLeadDto);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.fullName).toBe(createLeadDto.fullName);
      expect(response.body.email).toBe(createLeadDto.email);
      expect(response.body.phone).toBe(createLeadDto.phone);
      expect(response.body.companyName).toBe(createLeadDto.companyName);
      expect(response.body.companyCnpj).toBe(createLeadDto.companyCnpj);
      expect(response.body.companyWebsite).toBe(createLeadDto.companyWebsite);
      expect(response.body.estimatedValue).toBe(createLeadDto.estimatedValue);
      expect(response.body.source).toBe(createLeadDto.source);
      expect(response.body.status).toBe('PENDING');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify lead was created in database
      const createdLead = await prisma.lead.findFirst({
        where: { email: createLeadDto.email },
      });
      expect(createdLead).toBeDefined();
      expect(createdLead?.fullName).toBe(createLeadDto.fullName);
    });

    it('should create lead with only required fields and return 200 with created lead', async () => {
      // Arrange
      const createLeadDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        source: 'REFERRAL',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(createLeadDto);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.fullName).toBe(createLeadDto.fullName);
      expect(response.body.email).toBe(createLeadDto.email);
      expect(response.body.status).toBe('PENDING');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify lead was created
      const createdLead = await prisma.lead.findFirst({
        where: { email: createLeadDto.email },
      });
      expect(createdLead).toBeDefined();
    });

    it('should return 400 when fullName is missing', async () => {
      // Arrange
      const invalidDto = {
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        source: 'WEBSITE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when email format is invalid', async () => {
      // Arrange
      const invalidDto = {
        fullName: faker.person.fullName(),
        email: 'not-an-email',
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        source: 'WEBSITE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when source is invalid enum value', async () => {
      // Arrange
      const invalidDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        source: 'INVALID_SOURCE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when body contains unknown fields (forbidNonWhitelisted)', async () => {
      // Arrange
      const invalidDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        source: 'WEBSITE',
        unknownField: 'should not be here',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when companyWebsite is an invalid URL', async () => {
      // Arrange
      const invalidDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        companyWebsite: 'not-a-url',
        source: 'WEBSITE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      const now = new Date();
      const email = faker.internet.email();

      // Create a lead with this email first
      await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email,
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      const createLeadDto = {
        fullName: faker.person.fullName(),
        email, // Same email as existing lead
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        source: 'WEBSITE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(createLeadDto);

      // Assert
      expect(response.status).toBe(409);
    });
  });

  describe('GET /leads', () => {
    it('should list leads with default pagination (page=1, size=10)', async () => {
      // Arrange
      const now = new Date();
      await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });
      await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      // Act
      const response = await request(app.getHttpServer()).get('/leads');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.size).toBe(10);
    });

    it('should list leads with custom pagination', async () => {
      // Arrange
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        await prisma.lead.create({
          data: {
            id: randomUUID(),
            fullName: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number({ style: 'national' }),
            companyName: faker.company.name(),
            companyCnpj: faker.string.numeric(14),
            source: 'WEBSITE',
            status: 'PENDING',
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      // Act
      const response = await request(app.getHttpServer()).get('/leads?currentPage=2&size=2');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.currentPage).toBe(2);
      expect(response.body.size).toBe(2);
      expect(response.body.totalItems).toBe(3);
      expect(response.body.totalPages).toBeDefined();
    });

    it('should return 400 when size exceeds maximum (100)', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/leads?size=101');

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /leads/:id', () => {
    it('should return lead by id', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      // Act
      const response = await request(app.getHttpServer()).get(`/leads/${createdLead.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdLead.id);
      expect(response.body.fullName).toBe(createdLead.fullName);
      expect(response.body.email).toBe(createdLead.email);
    });

    it('should return 404 when lead not found', async () => {
      // Arrange
      const leadId = faker.string.uuid();

      // Act
      const response = await request(app.getHttpServer()).get(`/leads/${leadId}`);

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /leads/:id', () => {
    it('should update lead and return updated entity', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      const updateDto = {
        fullName: faker.person.fullName(),
        phone: faker.phone.number({ style: 'national' }),
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${createdLead.id}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.fullName).toBe(updateDto.fullName);
      expect(response.body.phone).toBe(updateDto.phone);

      // Verify update in database
      const updatedLead = await prisma.lead.findUnique({
        where: { id: createdLead.id },
      });
      expect(updatedLead?.fullName).toBe(updateDto.fullName);
    });

    it('should return 404 when lead to update not found', async () => {
      // Arrange
      const leadId = faker.string.uuid();
      const updateDto = {
        fullName: faker.person.fullName(),
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${leadId}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 400 when body contains email (forbidden by OmitType)', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      const updateDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(), // Not allowed in UpdateLeadDto
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${createdLead.id}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when body contains companyCnpj (forbidden by OmitType)', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      const updateDto = {
        fullName: faker.person.fullName(),
        companyCnpj: faker.string.numeric(14), // Not allowed in UpdateLeadDto
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${createdLead.id}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when companyWebsite is an invalid URL', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      const updateDto = {
        fullName: faker.person.fullName(),
        companyWebsite: 'not-a-url',
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${createdLead.id}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /leads/:id', () => {
    it('should delete lead and return 204', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      // Act
      const response = await request(app.getHttpServer()).delete(`/leads/${createdLead.id}`);

      // Assert
      expect(response.status).toBe(204);
      expect(response.text).toBe(''); // No content

      // Verify deletion in database
      const deletedLead = await prisma.lead.findUnique({
        where: { id: createdLead.id },
      });
      expect(deletedLead).toBeNull();
    });

    it('should return 404 when lead to delete not found', async () => {
      // Arrange
      const leadId = faker.string.uuid();

      // Act
      const response = await request(app.getHttpServer()).delete(`/leads/${leadId}`);

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('POST /leads/:id/enrichment', () => {
    it('should trigger enrichment and return 202 with message', async () => {
      // Arrange
      const now = new Date();
      const createdLead = await prisma.lead.create({
        data: {
          id: randomUUID(),
          fullName: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          companyName: faker.company.name(),
          companyCnpj: faker.string.numeric(14),
          source: 'WEBSITE',
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
      });

      // Act
      const response = await request(app.getHttpServer()).post(
        `/leads/${createdLead.id}/enrichment`,
      );

      // Assert
      expect(response.status).toBe(202);
      expect(response.body).toEqual({ message: 'Enrichment request received' });

      // Verify producer was called with correct payload
      const mockProducer = app.get(EnrichmentJobQueueProducer);
      expect(mockProducer.triggerEnrichment).toHaveBeenCalledWith({ leadId: createdLead.id });
      expect(mockProducer.triggerEnrichment).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      // Act
      const response = await request(app.getHttpServer()).post('/leads/not-a-uuid/enrichment');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 404 when lead does not exist', async () => {
      // Arrange
      const nonExistentId = faker.string.uuid();

      // Act
      const response = await request(app.getHttpServer()).post(
        `/leads/${nonExistentId}/enrichment`,
      );

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('GET /leads/:id/enrichments', () => {
    it.skip('should list enrichments for lead', async () => {
      // TODO: Implement after enrichment listing is finalized
      // Act
      const response = await request(app.getHttpServer()).get(`/leads/${faker.string.uuid()}/enrichments`);

      // Assert
      expect(response.status).toBe(200);
    });
  });
});
