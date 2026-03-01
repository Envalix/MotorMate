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
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const RECEIPT_ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Vehicle-scoped: POST + GET ───────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.list(vehicleId, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: multer.memoryStorage(),
      limits: { fileSize: RECEIPT_MAX_BYTES },
      fileFilter(_, file, cb) {
        if (RECEIPT_ALLOWED.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only images and PDFs allowed for receipts'), false);
        }
      },
    }),
  )
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateExpenseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.expensesService.create(vehicleId, user.id, dto, file);
  }
}

// ─── Standalone: PUT + DELETE ─────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesStandaloneController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: multer.memoryStorage(),
      limits: { fileSize: RECEIPT_MAX_BYTES },
      fileFilter(_, file, cb) {
        if (RECEIPT_ALLOWED.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only images and PDFs allowed for receipts'), false);
        }
      },
    }),
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateExpenseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.expensesService.update(id, user.id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.remove(id, user.id);
  }
}
