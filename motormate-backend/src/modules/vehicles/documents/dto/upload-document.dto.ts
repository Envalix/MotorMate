import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  @IsOptional()
  docType?: DocumentType;

  @IsISO8601()
  @IsOptional()
  expiryDate?: string;
}
