import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Response } from 'express';

@Controller({
  path: 'category',
  version: '1',
})
export class CategoryController {
  constructor(private categoryService: CategoryService) {}
  @Get()
  async get(@Res() res: Response) {
    try {
      const data = await this.categoryService.getAllCatgories();
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
