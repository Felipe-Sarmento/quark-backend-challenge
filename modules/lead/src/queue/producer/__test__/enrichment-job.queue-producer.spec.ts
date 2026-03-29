import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrichmentJobQueueProducer, EnrichmentJobPayload } from '../enrichment-job.queue-producer';
import { RABBITMQ_QUEUES } from '@modules/shared';

describe('EnrichmentJobQueueProducer', () => {
  let producer: EnrichmentJobQueueProducer;
  const mockEmit = vi
    .fn()
    .mockReturnValue({ toPromise: vi.fn().mockResolvedValue(undefined) });
  const mockClient = { emit: mockEmit };

  beforeEach(() => {
    vi.clearAllMocks();
    producer = new EnrichmentJobQueueProducer(mockClient as any);
  });

  describe('triggerEnrichment', () => {
    it('should emit enrichment trigger event with leadId payload', async () => {
      // Arrange
      const payload: EnrichmentJobPayload = {
        leadId: 'lead-uuid-123',
      };

      // Act
      await producer.triggerEnrichment(payload);

      // Assert
      expect(mockClient.emit).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.ENRICHMENT_TRIGGER,
        payload,
      );
      expect(mockClient.emit).toHaveBeenCalledTimes(1);
    });
  });
});
