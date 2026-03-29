import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Page } from '../../primitives/page';
import { Type } from 'class-transformer';

export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentPage?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 10;

  toPage(): Page {
    return Page.create(this.currentPage ?? 1, this.size ?? 10);
  }
}
