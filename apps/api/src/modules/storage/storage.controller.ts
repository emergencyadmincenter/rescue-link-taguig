import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { ResidentOrJwtAuthGuard } from '../../common/guards/resident-or-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('storage')
@UseGuards(ResidentOrJwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('private/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPrivateFile(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Default folder for private uploads if not specified otherwise
    // You could also accept a folder from the body, but for now we'll use a generic one
    // or let's just use 'private-general'
    const key = await this.storageService.uploadPrivateFile(file, 'private-general');
    
    return ApiResponse.success({ key });
  }

  @Get('private/access')
  async getPrivateAccess(
    @CurrentUser() user: any,
    @Query('key') key: string,
  ) {
    if (!key) {
      throw new BadRequestException('S3 object key is required');
    }

    // Here we can also add authorization checks to see if `user` is allowed to access this specific `key`.
    // Since the key itself is unguessable (UUID) and the endpoint requires auth,
    // this acts as a baseline level of security. True resource-based authorization
    // would be implemented in specific feature modules checking resource ownership.

    const url = await this.storageService.getPresignedUrl(key, 900); // 15 minutes
    return ApiResponse.success({ url });
  }
}
