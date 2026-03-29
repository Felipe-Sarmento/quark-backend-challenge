// Config
export * from './config/config.module';
export * from './config/config.service';

// Prisma
export * from './prisma/prisma.module';
export * from './prisma/prisma.service';
export * from './prisma/prisma.error-codes';

// RabbitMQ
export * from './rabbitmq/rabbitmq.module';
export * from './rabbitmq/rabbitmq.constants';
export * from './rabbitmq/rabbitmq.types';

// Core
export * from './core/entity';

// Primitives
export * from './primitives/cnpj';
export * from './primitives/phone';
export * from './primitives/page';

// Exceptions
export * from './exception/internal.exception';
export * from './exception/invalid-cnpj.exception';
export * from './exception/invalid-phone.exception';
export * from './exception/invalid-page.exception';

// HTTP Filters
export * from './http/filter/http-exception.filter';

// HTTP DTOs
// export * from './http/dto/page.query.dto'; // Commented to avoid class-transformer initialization issues in tests
