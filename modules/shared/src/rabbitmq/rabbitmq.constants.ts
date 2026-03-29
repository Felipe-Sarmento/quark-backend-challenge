export const RABBITMQ_QUEUES = {
  ENRICHMENT_TRIGGER: 'enrichment-trigger',
  ENRICHMENT_RESULT: 'enrichment-result',
  ENRICHMENT_DLQ: 'enrichment-trigger.dlq',
  CLASSIFICATION_TRIGGER: 'classification-trigger',
  CLASSIFICATION_RESULT: 'classification-result',
  CLASSIFICATION_DLQ: 'classification-trigger.dlq',
};

export const RABBITMQ_EXCHANGES = {
  LEAD_EVENTS: 'lead-events',
};

export const RABBITMQ_ROUTING_KEYS = {
  ENRICHMENT_REQUESTED: 'lead.enrichment.requested',
  ENRICHMENT_COMPLETED: 'lead.enrichment.completed',
  ENRICHMENT_FAILED: 'lead.enrichment.failed',
  CLASSIFICATION_REQUESTED: 'lead.classification.requested',
  CLASSIFICATION_COMPLETED: 'lead.classification.completed',
  CLASSIFICATION_FAILED: 'lead.classification.failed',
};
