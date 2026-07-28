import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Uploads a file to Amazon S3
   * @param file The multer file object
   * @param folder Optional folder path inside the bucket (e.g., 'avatars', 'attachments')
   * @param customFilename Optional custom filename (without extension). If not provided, a UUID will be used.
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'general', customFilename?: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const extension = extname(file.originalname);
    const filename = customFilename ? `${customFilename}${extension}` : `${crypto.randomUUID()}${extension}`;
    const key = `${folder}/${filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Failed to upload file to S3', error);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }
}
