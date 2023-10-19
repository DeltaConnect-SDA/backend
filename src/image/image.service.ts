import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bucket } from './enum';
import { encode } from 'blurhash';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  private client: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: configService.get('CLOUDFLARE_ACCESS_KEY'),
        secretAccessKey: configService.get('CLOUDFLARE_SECRET_KEY'),
      },
      endpoint: configService.get('CLOUDFLARE_ENDPOINT'),
      forcePathStyle: true,
      region: 'auto',
    });
  }
  async upload(
    buffer: Buffer,
    fileName: string,
    folder: string,
    size: number,
    mimeType: string,
  ) {
    const key = folder + '/' + fileName;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: Bucket.MAIN,
          Body: buffer,
          Key: key,
          ACL: 'public-read',
          ContentLength: size,
          ContentType: mimeType,
        }),
      );
    } catch (err) {
      Logger.error(err);
    }

    return this.configService.get('CLOUDFLARE_R2_PUBLIC_ENDPOINT') + key;
  }

  async blurhash(buffer: Buffer) {
    const { data, info } = await sharp(Buffer.from(buffer))
      .resize({ width: 64 })
      .ensureAlpha()
      .raw()
      .toBuffer({
        resolveWithObject: true,
      });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 3, 4);
  }
}
