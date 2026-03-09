import { Module } from '@nestjs/common';
import { AiClientService } from './ai-client.service';
import { AiController } from './ai.controller';

@Module({
    controllers: [AiController],
    providers: [AiClientService],
    exports: [AiClientService],
})
export class AiModule { }
