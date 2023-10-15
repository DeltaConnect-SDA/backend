import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { ComplaintDTO } from './dto';
import { GetUser } from 'src/auth/decorator';
import { Response } from 'express';
import { JwtGuard } from 'src/auth/guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { log } from 'console';

@Controller({ path: 'complaint', version: '1' })
export class ComplaintController {
  constructor(private complaintService: ComplaintService) {}
  // new ParseFilePipe({
  //   validators: [new FileTypeValidator({ fileType: /\.(jpg|jpeg|png)$/ })],
  // }),
  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard)
  @Post()
  async addNew(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() data: ComplaintDTO,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    log(images);
    try {
      const complaint = await this.complaintService.create(
        {
          ...data,
          categoryId: parseInt(data.categoryId.toString(), 10),
          priorityId: parseInt(data.priorityId.toString(), 10),
        },
        userId,
        images,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil dikirim!',
        data: complaint,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }

  @Get('latest')
  async getLatest(@Res() res: Response) {
    try {
      const complaints = await this.complaintService.findLatest();
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard)
  @Get('user')
  async getByUser(@GetUser('id') userId: string, @Res() res: Response) {
    try {
      const complaints = await this.complaintService.findByUser(userId);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  @Get('/:id')
  async show(@Param('id') id: string, @Res() res: Response) {
    try {
      const complaints = await this.complaintService.findById(parseInt(id, 10));
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard)
  @Get('/:id/auth')
  async showWithSavedStatus(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaints =
        await this.complaintService.findComplaintWithSaveStatus(
          parseInt(id, 10),
          userId,
        );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard)
  @Post('save')
  async save(
    @Body('complaintId') complaintId: number,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.addToSavedComplaints(
        parseInt(complaintId.toString(), 10),
        userId,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil disimpan!',
        data: complaint,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard)
  @Delete('/:id/save')
  async unSave(
    @Param('id') complaintId: string,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.removeSavedComplaints(
        parseInt(complaintId.toString(), 10),
        userId,
      );
      return res.status(HttpStatus.NO_CONTENT).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil dihapus dari simpan!',
        data: complaint,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }
}
