import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  stock: number;
}

export class UpdateProductDTO {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  stock: number;

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  active: number;
}

export class GetProductsDTO {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  price: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  stock: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  page: number = 0;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  size: number = 30;
}
