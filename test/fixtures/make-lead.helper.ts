import { faker } from '@faker-js/faker';
import { LeadFactory } from '../../modules/lead/src/core/factory/lead.factory';
import { LeadSource, LeadStatus } from '../../modules/lead/src/core/entity/lead.entity';
import type { LeadEntityFields } from '../../modules/lead/src/core/entity/types';

faker.seed(42);

export const makeLeadEntity = (overrides: Partial<LeadEntityFields> = {}) =>
  LeadFactory.create({
    id: faker.string.uuid(),
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'national' }),
    companyName: faker.company.name(),
    companyCnpj: faker.string.numeric(14),
    companyWebsite: faker.internet.url(),
    estimatedValue: faker.number.float({ min: 1000, max: 1_000_000, fractionDigits: 2 }),
    source: LeadSource.WEBSITE,
    status: LeadStatus.PENDING,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  });
