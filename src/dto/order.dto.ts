import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

export class OrderProduct {
  @IsNotEmpty()
  @IsNumber()
  public id: number;

  @IsNotEmpty()
  @IsNumber()
  public quantity: number;
}

export class CreateOrderDTO {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderProduct)
  public products: OrderProduct[];
}
