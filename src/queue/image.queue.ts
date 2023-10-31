import { Process, Processor, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { ImageService } from '../image/image.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { log } from 'console';
import { Folder } from 'src/image/enum';

@Injectable()
@Processor('imageUpload')
export class ImageQueue {
  constructor(
    private readonly imageService: ImageService,
    private prismaSerive: PrismaService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @Process('addComplaint')
  async uploadComplaintImages(
    job: Job<{
      complaintId: number;
      buffer: Buffer;
      fileName: string;
      size: number;
      mimeType: string;
    }>,
  ) {
    const { data } = job;
    const { complaintId, buffer, fileName, size, mimeType } = data;
    const path = await this.imageService.upload(
      buffer,
      fileName,
      Folder.COMPLAINT,
      size,
      mimeType,
    );

    log('storing images');
    try {
      log('creating placeholder');
      const placeholder = await this.imageService.blurhash(buffer);
      await this.prismaSerive.complaintImages.create({
        data: { complaintId, path, placeholder },
      });
      log('images stored');
    } catch (err) {
      log(err);
      throw new Error(err);
    }
  }

  @Process('updateComplaintActivity')
  async uploadComplaintActivityImages(
    job: Job<{
      activityId: number;
      buffer: Buffer;
      fileName: string;
      size: number;
      mimeType: string;
    }>,
  ) {
    const { data } = job;
    const { activityId, buffer, fileName, size, mimeType } = data;
    const path = await this.imageService.upload(
      buffer,
      `${(Math.random() + 1).toString(36).substring(2)}-${fileName}`,
      Folder.COMPLAINT,
      size,
      mimeType,
    );

    log('storing images');
    try {
      log('creating placeholder');
      const placeholder = await this.imageService.blurhash(buffer);
      await this.prismaSerive.complaintActivityImages.create({
        data: { complaintActivityId: activityId, path, placeholder },
      });
      log('images stored');
    } catch (err) {
      log(err);
      throw new Error(err);
    }
  }
}
