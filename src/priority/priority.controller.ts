import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { Response } from 'express';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller({
  path: 'priorities',
  version: '1',
})
export class PriorityController {
  constructor(
    private priorityService: PriorityService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  @Get()
  async get(@Res() res: Response) {
    try {
      let data;
      const cachedData = await this.cacheService.get('priorities');
      if (cachedData) {
        data = cachedData;
      } else {
        data = await this.priorityService.getAllPriorities();
        await this.cacheService.set('priorities', data);
      }
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
