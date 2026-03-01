import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // GET /vehicles/:vehicleId/documents
  @Get()
  list(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.documentsService.listDocuments(vehicleId, user.id);
  }

  // POST /vehicles/:vehicleId/documents
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: multer.memoryStorage(),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter(_, file, cb) {
        if (ALLOWED_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
        }
      },
    }),
  )
  upload(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocuments(vehicleId, user.id, files, dto);
  }

  // GET /vehicles/:vehicleId/documents/download-all
  @Get('download-all')
  @HttpCode(HttpStatus.OK)
  downloadAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    return this.documentsService.downloadAll(vehicleId, user.id, res);
  }

  // GET /vehicles/:vehicleId/documents/:docId/download
  @Get(':docId/download')
  getSignedUrl(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.documentsService.getSignedUrl(vehicleId, user.id, docId);
  }

  // DELETE /vehicles/:vehicleId/documents/:docId
  @Delete(':docId')
  @HttpCode(HttpStatus.OK)
  delete(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.documentsService.deleteDocument(vehicleId, user.id, docId);
  }
}
