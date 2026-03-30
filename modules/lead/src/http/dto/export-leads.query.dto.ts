import { IsEnum, IsOptional } from 'class-validator';
import { LeadStatus } from '../../core/entity/lead.entity';

export class ExportLeadsQueryDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
