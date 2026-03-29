# E2E Test Skill

**When to use:** Writing integration tests for NestJS HTTP controllers using supertest to validate the full request/response cycle.

## Test Framework & Setup

- **Test Runner:** Vitest with explicit imports
- **HTTP Client:** supertest for making HTTP requests to the NestJS app
- **Module Setup:** `@nestjs/testing` with `Test.createTestingModule()`
- **File Location:** `http/controller/__test__/[entity].controller.e2e.spec.ts`
- **Pattern:** AAA (Arrange, Act, Assert) with explicit comments
- **Mocking:** Service layer (domain logic) mocked with `vi.fn()` — HTTP layer only, no database access
- **Seeding:** Use faker with deterministic seed for realistic test data (seed `42` for consistency)

## Test File Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { LeadController } from '../lead.controller';
import { LeadService } from '../../core/service/lead.service';
import { Page } from '@modules/shared';

faker.seed(42); // deterministic across test runs

describe('LeadController (e2e)', () => {
  let app: INestApplication;

  const mockLeadService = {
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as LeadService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadController],
      providers: [
        {
          provide: LeadService,
          useValue: mockLeadService,
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /leads', () => {
    it('should create lead and return 200', async () => {
      // Arrange
      const createLeadDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        companyWebsite: faker.internet.url(),
        estimatedValue: faker.number.float({ min: 1000, max: 1_000_000 }),
        source: 'WEBSITE',
      };

      (mockLeadService.create as any).mockResolvedValue(undefined);

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(createLeadDto);

      // Assert
      expect(response.status).toBe(200);
      expect(mockLeadService.create).toHaveBeenCalledWith(createLeadDto);
    });

    it('should return 400 when required field is missing', async () => {
      // Arrange
      const invalidDto = {
        email: faker.internet.email(),
        // missing fullName and other required fields
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('validation');
      expect(mockLeadService.create).not.toHaveBeenCalled();
    });

    it('should return 400 when email format is invalid', async () => {
      // Arrange
      const invalidDto = {
        fullName: faker.person.fullName(),
        email: 'not-an-email',
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        companyCnpj: faker.string.numeric(14),
        companyWebsite: faker.internet.url(),
        estimatedValue: faker.number.float({ min: 1000, max: 1_000_000 }),
        source: 'WEBSITE',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send(invalidDto);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
      expect(mockLeadService.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /leads', () => {
    it('should list leads with default pagination', async () => {
      // Arrange
      const mockLeads = [
        { id: faker.string.uuid(), fullName: faker.person.fullName() },
        { id: faker.string.uuid(), fullName: faker.person.fullName() },
      ];
      const mockPage = new Page(1, 10);

      (mockLeadService.list as any).mockResolvedValue({
        leads: mockLeads,
        totalItems: 2,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/leads');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockLeadService.list).toHaveBeenCalledWith(expect.any(Page));
    });

    it('should list leads with custom pagination', async () => {
      // Arrange
      const mockPage = new Page(2, 5);
      const mockLeads = Array.from({ length: 5 }, () => ({
        id: faker.string.uuid(),
        fullName: faker.person.fullName(),
      }));

      (mockLeadService.list as any).mockResolvedValue({
        leads: mockLeads,
        totalItems: 15,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/leads?page=2&limit=5');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
    });
  });

  describe('GET /leads/:id', () => {
    it('should return lead by id', async () => {
      // Arrange
      const leadId = faker.string.uuid();
      const mockLead = {
        id: leadId,
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
      };

      (mockLeadService.findById as any).mockResolvedValue(mockLead);

      // Act
      const response = await request(app.getHttpServer())
        .get(`/leads/${leadId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(leadId);
      expect(mockLeadService.findById).toHaveBeenCalledWith(leadId);
    });

    it('should return 404 when lead not found', async () => {
      // Arrange
      const leadId = faker.string.uuid();

      (mockLeadService.findById as any).mockRejectedValue(
        new Error('Lead not found'),
      );

      // Act
      const response = await request(app.getHttpServer())
        .get(`/leads/${leadId}`);

      // Assert
      expect(response.status).toBe(404);
      expect(mockLeadService.findById).toHaveBeenCalledWith(leadId);
    });
  });

  describe('PATCH /leads/:id', () => {
    it('should update lead and return updated entity', async () => {
      // Arrange
      const leadId = faker.string.uuid();
      const updateLeadDto = {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
      };
      const updatedLead = {
        id: leadId,
        ...updateLeadDto,
      };

      (mockLeadService.update as any).mockResolvedValue(updatedLead);

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${leadId}`)
        .send(updateLeadDto);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.fullName).toBe(updateLeadDto.fullName);
      expect(mockLeadService.update).toHaveBeenCalledWith(leadId, updateLeadDto);
    });

    it('should return 404 when lead to update not found', async () => {
      // Arrange
      const leadId = faker.string.uuid();
      const updateLeadDto = {
        fullName: faker.person.fullName(),
      };

      (mockLeadService.update as any).mockRejectedValue(
        new Error('Lead not found'),
      );

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/leads/${leadId}`)
        .send(updateLeadDto);

      // Assert
      expect(response.status).toBe(404);
      expect(mockLeadService.update).toHaveBeenCalledWith(leadId, updateLeadDto);
    });
  });

  describe('DELETE /leads/:id', () => {
    it('should delete lead and return 204', async () => {
      // Arrange
      const leadId = faker.string.uuid();

      (mockLeadService.delete as any).mockResolvedValue(undefined);

      // Act
      const response = await request(app.getHttpServer())
        .delete(`/leads/${leadId}`);

      // Assert
      expect(response.status).toBe(204);
      expect(mockLeadService.delete).toHaveBeenCalledWith(leadId);
    });

    it('should return 404 when lead to delete not found', async () => {
      // Arrange
      const leadId = faker.string.uuid();

      (mockLeadService.delete as any).mockRejectedValue(
        new Error('Lead not found'),
      );

      // Act
      const response = await request(app.getHttpServer())
        .delete(`/leads/${leadId}`);

      // Assert
      expect(response.status).toBe(404);
      expect(mockLeadService.delete).toHaveBeenCalledWith(leadId);
    });
  });
});
```

## Test Data Generation with Faker

### Using Faker for Request Bodies

Generate realistic test data inline within test cases using `@faker-js/faker`:

```typescript
it('should create lead with generated data', async () => {
  // Arrange
  const createLeadDto = {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'national' }),
    companyName: faker.company.name(),
    companyCnpj: faker.string.numeric(14),
    companyWebsite: faker.internet.url(),
    estimatedValue: faker.number.float({ min: 1000, max: 1_000_000 }),
    source: 'WEBSITE',
  };

  (mockLeadService.create as any).mockResolvedValue(undefined);

  // Act
  const response = await request(app.getHttpServer())
    .post('/leads')
    .send(createLeadDto);

  // Assert
  expect(response.status).toBe(200);
});
```

### Common Faker Methods for HTTP DTOs

```typescript
// Person data
faker.person.fullName()              // John Doe
faker.internet.email()               // john.doe@example.com
faker.phone.number({ style: 'national' })  // (555) 123-4567

// Company data
faker.company.name()                 // Acme Inc
faker.string.numeric(14)             // 12345678901234 (CNPJ format)
faker.internet.url()                 // https://example.com

// Numeric data
faker.number.float({ min: 1000, max: 1_000_000 })  // 45234.23
faker.number.int({ min: 1, max: 10 })              // 7

// IDs and strings
faker.string.uuid()                  // 550e8400-e29b-41d4-a716-446655440000
faker.string.alphaNumeric(10)        // aBcD1234eF
```

## Mocking Patterns

### Mock Service Setup

```typescript
const mockLeadService = {
  create: vi.fn(),
  list: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as LeadService;

beforeEach(async () => {
  vi.clearAllMocks(); // reset all mocks
  // ... module setup
});
```

### Mock Return Values (Success)

```typescript
const mockLead = { id: faker.string.uuid(), fullName: faker.person.fullName() };
(mockLeadService.findById as any).mockResolvedValue(mockLead);
```

### Mock Return Values (Error)

```typescript
// Using Error
(mockLeadService.delete as any).mockRejectedValue(
  new Error('Lead not found'),
);

// Using custom exception
(mockLeadService.create as any).mockRejectedValue(
  new LeadAlreadyExistsException('Email already exists'),
);
```

### Assert Service Calls

```typescript
// Called with specific arguments
expect(mockLeadService.create).toHaveBeenCalledWith(expectedDto);

// Called exact number of times
expect(mockLeadService.findById).toHaveBeenCalledTimes(1);

// Never called
expect(mockLeadService.update).not.toHaveBeenCalled();
```

## Test Organization

### Describe Block Hierarchy

```
describe('LeadController (e2e)', () => {
  describe('POST /leads', () => {
    it('should create lead and return 200')
    it('should return 400 when required field is missing')
    // ...
  })
  describe('GET /leads', () => {
    it('should list leads with default pagination')
    // ...
  })
})
```

### Test Ordering by HTTP Status

Group tests in this order:

1. **2xx (success)** — Happy path, valid operations
2. **4xx (client errors)** — Validation errors, not found, conflict
3. **5xx (server errors)** — Service exceptions, database errors

```typescript
describe('POST /leads', () => {
  it('should create and return 200', async () => { });        // 2xx
  it('should return 400 on missing field', async () => { });  // 4xx
  it('should return 409 on duplicate email', async () => { }); // 4xx
});
```

## Assertions

### Response Status

```typescript
expect(response.status).toBe(200);
expect(response.status).toBe(400);
expect(response.status).toBe(404);
expect(response.status).toBe(204); // No Content
```

### Response Body

```typescript
// Full response object
expect(response.body).toEqual({ id: 'xxx', fullName: 'John' });

// Specific fields
expect(response.body.id).toBe(leadId);
expect(response.body.data).toHaveLength(2);

// Nested structures
expect(response.body.pagination.page).toBe(2);
expect(response.body.pagination.limit).toBe(10);
```

### Service Call Assertions

```typescript
// Verify service was called
expect(mockLeadService.findById).toHaveBeenCalledWith(leadId);

// Verify service was not called
expect(mockLeadService.create).not.toHaveBeenCalled();

// Verify call arguments
expect(mockLeadService.update).toHaveBeenCalledWith(
  leadId,
  expect.objectContaining({ fullName: 'John' }),
);
```

## One Concept Per Test

Each `it()` should test exactly one behavior:

```typescript
// ❌ BAD: Testing multiple behaviors
it('should create, list, and find leads', async () => {
  // Creating
  // Listing
  // Finding
});

// ✅ GOOD: Single behavior per test
it('should create lead and return 200', async () => {
  // Only test creation
});

it('should list leads with pagination', async () => {
  // Only test listing
});
```

## Lifecycle Hooks

### beforeEach — Setup for Each Test

```typescript
beforeEach(async () => {
  vi.clearAllMocks(); // Reset all mocks

  const module: TestingModule = await Test.createTestingModule({
    controllers: [LeadController],
    providers: [{ provide: LeadService, useValue: mockLeadService }],
  }).compile();

  app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
});
```

### afterEach — Cleanup After Each Test

```typescript
afterEach(async () => {
  await app.close(); // Close the app to clean up resources
});
```

## Checklist

- [ ] File located at `http/controller/__test__/[entity].controller.e2e.spec.ts`
- [ ] Imports: `Test`, `TestingModule`, `INestApplication`, `ValidationPipe` from `@nestjs/testing` and `@nestjs/common`
- [ ] Imports: `request` from `supertest`
- [ ] Imports: `describe, it, expect, vi, beforeEach, afterEach` from `vitest`
- [ ] Imports: `faker` from `@faker-js/faker`
- [ ] `faker.seed(42)` at top of file for deterministic data
- [ ] `beforeEach` creates TestingModule with mocked service layer
- [ ] `beforeEach` initializes NestApplication with ValidationPipe
- [ ] `afterEach` closes the app
- [ ] All services mocked with `vi.fn()` — no database, no queue access
- [ ] AAA pattern with explicit `// Arrange`, `// Act`, `// Assert` comments
- [ ] One concept per `it()`
- [ ] Tests ordered by HTTP status code (2xx → 4xx → 5xx)
- [ ] Happy path tests come first in each describe block
- [ ] Response assertions check both status and body
- [ ] Service call assertions verify correct arguments passed
- [ ] Validation errors tested (400 status)
- [ ] Not found errors tested (404 status)
- [ ] Conflict errors tested (409 status if applicable)

## Related Skills

- `/unit-test` — Write service/repository unit tests with mocks
- `/entity-creation` — Define entities that services and controllers use
- `/factory-creation` — Create factories for entity test data
