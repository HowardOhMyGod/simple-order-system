import { IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetOrdersDTO {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  page: number = 0;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  size: number = 30;
}
