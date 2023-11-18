import { Module } from '@nestjs/common';
import { SuggestionService } from './suggestion.service';
import { SuggestionController } from './suggestion.controller';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'imageUpload',
      },
      {
        name: 'sendNotification',
      },
    ),
  ],
  providers: [SuggestionService],
  controllers: [SuggestionController],
})
export class SuggestionModule {}
