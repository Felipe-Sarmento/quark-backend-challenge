import { IsString, MinLength, MaxLength, IsEmail, IsEnum, IsOptional, IsUrl, IsNumber, Min } from 'class-validator';
import { LeadSource } from '../../core/entity/lead.entity';

export class CreateLeadDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName!: string;

  @IsString()
  companyCnpj!: string;

  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedValue?: number;

  @IsEnum(LeadSource)
  source!: LeadSource;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
