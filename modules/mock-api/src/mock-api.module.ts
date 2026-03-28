import { Module } from '@nestjs/common';
import { MockApiService } from './core/service/mock-api.service';
import { CompanyController } from './http/controller/company.controller';

@Module({
  controllers: [CompanyController],
  providers: [MockApiService],
  exports: [MockApiService],
})
export class MockApiModule {}
