import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateId } from '@sse/shared-utils';

export interface UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrlBase: string;
  private readonly provider: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get<string>('STORAGE_PROVIDER', 's3');
    this.bucket = this.config.get<string>('S3_BUCKET_NAME', '');
    this.publicUrlBase = this.config.get<string>('S3_PUBLIC_URL_BASE', '');

    if (!this.bucket) {
      this.logger.warn(
        'S3_BUCKET_NAME not configured — StorageService will operate in mock mode',
      );
      this.s3 = null;
      return;
    }

    if (this.provider === 'r2') {
      const accountId = this.config.get<string>('R2_ACCOUNT_ID', '');
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID', ''),
          secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY', ''),
        },
      });
    } else {
      this.s3 = new S3Client({
        region: this.config.get<string>('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  generateKey(tenantId: string, entity: string, fileName: string): string {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${tenantId}/${entity}/${generateId()}-${safeFileName}`;
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    if (!this.s3) {
      this.logger.log(`[MOCK] Upload: ${key} (${buffer.length} bytes, ${mimeType})`);
      return {
        url: `https://mock-storage.local/${this.bucket}/${key}`,
        key,
      };
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const url = this.publicUrlBase
      ? `${this.publicUrlBase}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { url, key };
  }

  async delete(key: string): Promise<void> {
    if (!this.s3) {
      this.logger.log(`[MOCK] Delete: ${key}`);
      return;
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.s3) {
      return `https://mock-storage.local/${this.bucket}/${key}?signed=true`;
    }

    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }
}
