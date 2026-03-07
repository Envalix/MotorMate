import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { ImagesService } from './images.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:id/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  getImages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.imagesService.getImages(id, user.id);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter(_, file, cb) {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.imagesService.uploadImages(id, user.id, files);
  }

  @Patch(':imgId/primary')
  @HttpCode(HttpStatus.OK)
  setPrimary(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imgId', ParseUUIDPipe) imgId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.imagesService.setPrimary(id, user.id, imgId);
  }

  @Delete(':imgId')
  @HttpCode(HttpStatus.OK)
  deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imgId', ParseUUIDPipe) imgId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.imagesService.deleteImage(id, user.id, imgId);
  }
}
