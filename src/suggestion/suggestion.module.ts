import { Module } from '@nestjs/common';
import { SuggestionService } from './suggestion.service';
import { SuggestionController } from './suggestion.controller';

@Module({
  providers: [SuggestionService],
  controllers: [SuggestionController]
})
export class SuggestionModule {}
