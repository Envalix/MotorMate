import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateBuyRecordDto {
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsDateString()
  purchaseDate: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  sellerName?: string;

  @IsString()
  @IsOptional()
  sellerNic?: string;

  @IsString()
  @IsOptional()
  sellerContact?: string;

  @IsString()
  @IsOptional()
  sellerAddress?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
