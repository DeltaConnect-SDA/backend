import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Response } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller({
  path: 'category',
  version: '1',
})
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  @Get()
  async get(@Res() res: Response) {
    try {
      let data;
      const cachedData = await this.cacheService.get('categories');
      if (cachedData) {
        data = cachedData;
      } else {
        data = await this.categoryService.getAllCatgories();
        await this.cacheService.set('categories', data);
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data kategori',
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
