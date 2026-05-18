import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MULTIPART_CHUNK = 5 * 1024 * 1024;

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string | null = null;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('S3_REGION');
    const bucket = this.config.get<string>('S3_BUCKET');
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKey = this.config.get<string>('S3_ACCESS_KEY');
    const secretKey = this.config.get<string>('S3_SECRET_KEY');

    if (!region || !bucket || !accessKey || !secretKey) {
      this.logger.warn('S3 not fully configured — S3UploadService will be inactive');
      this.configured = false;
      return;
    }

    this.bucket = bucket;
    this.configured = true;

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.configured || !this.client || !this.bucket) {
      this.logger.warn('S3 not configured — skipping upload');
      return null;
    }

    if (buffer.byteLength > MULTIPART_CHUNK * 2) {
      return this.multipartUploadFromBuffer(key, buffer, contentType);
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    this.logger.log(`Uploaded s3://${this.bucket}/${key}`);
    return key;
  }

  async multipartUploadFromGenerator(
    key: string,
    generator: AsyncGenerator<Buffer>,
    contentType: string,
  ): Promise<string | null> {
    if (!this.configured || !this.client || !this.bucket) {
      this.logger.warn('S3 not configured — skipping multipart upload');
      return null;
    }

    const createResp = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
    );
    const uploadId = createResp.UploadId!;
    const parts: { PartNumber: number; ETag: string }[] = [];
    let partNumber = 1;

    try {
      for await (const chunk of generator) {
        const uploadResp = await this.client.send(
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: chunk,
          }),
        );
        parts.push({ PartNumber: partNumber, ETag: uploadResp.ETag! });
        partNumber++;
      }

      if (parts.length === 0) {
        await this.client.send(
          new AbortMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
          }),
        );
        return null;
      }

      await this.client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      );

      this.logger.log(`Multipart uploaded s3://${this.bucket}/${key} in ${parts.length} parts`);
      return key;
    } catch (err) {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
        }),
      );
      this.logger.error(`Multipart upload failed for ${key}: ${(err as Error).message}`);
      throw err;
    }
  }

  async multipartUploadFromBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.configured || !this.client || !this.bucket) {
      return null;
    }

    const createResp = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
    );
    const uploadId = createResp.UploadId!;
    const parts: { PartNumber: number; ETag: string }[] = [];
    let offset = 0;
    let partNumber = 1;

    try {
      while (offset < buffer.byteLength) {
        const end = Math.min(offset + MULTIPART_CHUNK, buffer.byteLength);
        const chunk = buffer.subarray(offset, end);
        const uploadResp = await this.client.send(
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: chunk,
          }),
        );
        parts.push({ PartNumber: partNumber, ETag: uploadResp.ETag! });
        partNumber++;
        offset = end;
      }

      await this.client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      );

      this.logger.log(`Multipart uploaded s3://${this.bucket}/${key} in ${parts.length} parts`);
      return key;
    } catch (err) {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
        }),
      );
      throw err;
    }
  }

  async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string | null> {
    if (!this.configured || !this.client || !this.bucket) {
      this.logger.warn('S3 not configured — cannot generate presigned URL');
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: 'attachment; filename="report.xlsx"',
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.configured || !this.client || !this.bucket) {
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
