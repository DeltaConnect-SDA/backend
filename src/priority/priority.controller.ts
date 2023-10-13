import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { Response } from 'express';

@Controller({
  path: 'priority',
  version: '1',
})
export class PriorityController {
  constructor(private priorityService: PriorityService) {}

  @Get()
  async get(@Res() res: Response) {
    try {
      const data = await this.priorityService.getAllPriorities();

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data prioritas',
        data: data,
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
}
