import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { StatusService } from './status.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Response } from 'express';

@Controller({ path: 'statuses', version: '1' })
export class StatusController {
  constructor(
    private statusService: StatusService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  @Get()
  async get(@Res() res: Response) {
    try {
      let data;
      const cachedData = await this.cacheService.get('statuses');
      if (cachedData) {
        data = cachedData;
      } else {
        data = await this.statusService.getAllStatuses();
        await this.cacheService.set('statuses', data);
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data status',
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
