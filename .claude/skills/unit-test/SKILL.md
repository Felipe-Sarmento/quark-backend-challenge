# Unit Test Skill

**When to use:** Writing unit tests for services, usecases, value objects, or factories using the AAA (Arrange/Act/Assert) pattern with mocked dependencies.

## Rules

1. Test runner is **Vitest** — always import `describe`, `it`, `expect`, `vi` explicitly from `'vitest'`
2. Files go in `__test__/` subdirectory next to source, named `[entity].spec.ts`
3. Outer `describe()` = class/entity name; inner `describe()` = `'methodName — scenario'`
4. Each `it()` tests exactly one behavior (one concept per test)
5. Use **AAA pattern**: `// Arrange` → `// Act` → `// Assert` (explicit comments for non-trivial tests; collapse into one line only for trivial cases)
6. **Always mock every dependency** of the class under test — no exceptions, regardless of type (Prisma, HTTP client, queue producer, another service, etc.)
7. Mock dependencies with `vi.fn()` — return values via `.mockReturnValue()` or `.mockResolvedValue()`
8. Exception testing: `expect(() => ...).toThrow(ExceptionClass)` and optionally `.toThrow(/regex/)` for message content
9. Test naming: `it('should [expected behavior]', ...)` — describe what should happen, not how

---

## Structure: Service with Mocked Dependencies

```typescript
// lead.service.ts (source being tested)
@Injectable()
export class LeadService {
  constructor(
    private readonly repository: ILeadRepository,
    private readonly enrichmentProducer: EnrichmentJobQueueProducer,
  ) {}

  async createLead(dto: CreateLeadDto): Promise<Lead> {
    const lead = Lead.create(dto);
    await this.repository.save(lead);
    await this.enrichmentProducer.emit(lead.id);
    return lead;
  }

  async findById(id: string): Promise<Lead> {
    const lead = await this.repository.findById(id);
    if (!lead) throw new NotFoundLeadException(id);
    return lead;
  }
}
```

```typescript
// __test__/lead.service.spec.ts (test file)
import { describe, it, expect, vi } from 'vitest';
import { LeadService } from '../lead.service';
import { Lead } from '../../core/entity/lead';
import { ILeadRepository } from '../../core/interface/lead.repository.interface';
import { EnrichmentJobQueueProducer } from '../../queue/producer/enrichment-job.queue-producer';
import { NotFoundLeadException } from '../../core/exception/not-found.lead.exception';

describe('LeadService', () => {
  // Setup mocks for all dependencies
  const mockRepository = {
    save: vi.fn(),
    findById: vi.fn(),
  } as unknown as ILeadRepository;

  const mockEnrichmentProducer = {
    emit: vi.fn(),
  } as unknown as EnrichmentJobQueueProducer;

  let service: LeadService;

  beforeEach(() => {
    // Clear mock call history before each test
    vi.clearAllMocks();
    service = new LeadService(mockRepository, mockEnrichmentProducer);
  });

  describe('createLead', () => {
    it('should create lead and emit enrichment job', async () => {
      // Arrange
      const dto = { email: 'test@example.com', name: 'Test Lead' };
      const expectedLead = Lead.create(dto);
      (mockRepository.save as any).mockResolvedValue(undefined);
      (mockEnrichmentProducer.emit as any).mockResolvedValue(undefined);

      // Act
      const result = await service.createLead(dto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        name: 'Test Lead',
      }));
      expect(mockEnrichmentProducer.emit).toHaveBeenCalledWith(result.id);
      expect(result.email).toBe('test@example.com');
    });

    it('should throw if repository fails', async () => {
      // Arrange
      const dto = { email: 'test@example.com', name: 'Test Lead' };
      (mockRepository.save as any).mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(service.createLead(dto)).rejects.toThrow('DB error');
      expect(mockEnrichmentProducer.emit).not.toHaveBeenCalled();
    });

    it('should not emit enrichment job if repository save fails', async () => {
      // Arrange
      const dto = { email: 'test@example.com', name: 'Test Lead' };
      (mockRepository.save as any).mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(service.createLead(dto)).rejects.toThrow();
      expect(mockEnrichmentProducer.emit).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return lead if found', async () => {
      // Arrange
      const leadId = 'lead-123';
      const expectedLead = { id: leadId, email: 'test@example.com' };
      (mockRepository.findById as any).mockResolvedValue(expectedLead);

      // Act
      const result = await service.findById(leadId);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(leadId);
      expect(result).toEqual(expectedLead);
    });

    it('should throw NotFoundLeadException if lead not found', async () => {
      // Arrange
      const leadId = 'nonexistent-id';
      (mockRepository.findById as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(leadId)).rejects.toThrow(NotFoundLeadException);
    });

    it('should throw NotFoundLeadException with correct lead ID', async () => {
      // Arrange
      const leadId = 'missing-lead-123';
      (mockRepository.findById as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(leadId)).rejects.toThrow(/missing-lead-123/);
    });
  });
});
```

---

## Structure: Value Object (Trivial Cases — Collapse AAA)

```typescript
// __test__/page.spec.ts
import { describe, it, expect } from 'vitest';
import { Page } from '../page';
import { InvalidPageException } from '../../exception/invalid-page.exception';

describe('Page', () => {
  describe('create — valid', () => {
    it('should create page with minimum valid values', () => {
      const page = Page.create(1, 1);
      expect(page.currentPage).toBe(1);
      expect(page.size).toBe(1);
    });

    it('should compute toSkip correctly for page 1', () => {
      const page = Page.create(1, 10);
      expect(page.toSkip()).toBe(0);
    });

    it('should compute toSkip correctly for page 3', () => {
      const page = Page.create(3, 10);
      expect(page.toSkip()).toBe(20);
    });
  });

  describe('create — invalid', () => {
    it('should throw for currentPage = 0', () => {
      expect(() => Page.create(0, 10)).toThrow(InvalidPageException);
    });

    it('should throw with appropriate error message', () => {
      expect(() => Page.create(0, 10)).toThrow(/currentPage=0.*must be an integer >= 1/);
    });
  });

  describe('withTotals', () => {
    it('should return a new instance (immutable)', () => {
      const page = Page.create(1, 10);
      const enriched = page.withTotals(30);
      expect(page).not.toBe(enriched);
      expect(page.totalItems).toBeUndefined();
      expect(enriched.totalItems).toBe(30);
    });

    it('should preserve currentPage and size', () => {
      const page = Page.create(3, 15);
      const enriched = page.withTotals(100);
      expect(enriched.currentPage).toBe(3);
      expect(enriched.size).toBe(15);
    });
  });
});
```

---

## Mocking Patterns

### Mocking a Service Dependency

```typescript
const mockEmailService = {
  send: vi.fn(),
} as unknown as EmailService;

// Return value (synchronous)
(mockEmailService.send as any).mockReturnValue(true);

// Resolved value (asynchronous)
(mockEmailService.send as any).mockResolvedValue({ id: 'email-123' });

// Rejected value (error case)
(mockEmailService.send as any).mockRejectedValue(new Error('SMTP failed'));

// Custom implementation
(mockEmailService.send as any).mockImplementation((to: string) => {
  if (to === 'invalid@') throw new Error('Invalid email');
  return { id: 'email-123' };
});
```

### Spying on Methods

```typescript
const entity = new Lead({ id: '1', email: 'test@example.com' });
const spy = vi.spyOn(entity, 'validate');

entity.validate();

expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith();
```

### Verifying Mock Calls

```typescript
// Called with specific arguments
expect(mockRepository.save).toHaveBeenCalledWith(lead);

// Called N times
expect(mockEmailService.send).toHaveBeenCalledTimes(2);

// Not called
expect(mockProducer.emit).not.toHaveBeenCalled();

// Called with partial object match
expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
  email: 'test@example.com',
}));

// Clear history before each test
vi.clearAllMocks();
```

---

## Checklist

- [ ] Test file is in `__test__/` subdirectory, named `[entity].spec.ts`
- [ ] Imports explicitly from `'vitest'`: `describe, it, expect, vi`
- [ ] Outer `describe()` = class name
- [ ] Inner `describe()` = method name with scenario (e.g., `'createLead — happy path'`)
- [ ] Each `it()` tests exactly one behavior
- [ ] **All external dependencies are mocked** (repository, HTTP client, queue producer, other services)
- [ ] AAA pattern is explicit in comments (at least for non-trivial tests)
- [ ] Test names follow `'should [expected behavior]'` pattern
- [ ] Exception tests use `.toThrow(ExceptionClass)` or `.toThrow(/regex/)`
- [ ] Mock call verification: `.toHaveBeenCalledWith()`, `.toHaveBeenCalledTimes()`, `.not.toHaveBeenCalled()`
- [ ] `beforeEach()` clears mocks: `vi.clearAllMocks()`
- [ ] Tests pass: `pnpm test`
