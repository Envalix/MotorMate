import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateSellRecordDto {
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsDateString()
  saleDate: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsString()
  @IsOptional()
  buyerContact?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
