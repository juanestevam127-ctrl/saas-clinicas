import { Module } from '@nestjs/common';
import { LembretesService } from './lembretes.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [LembretesService],
})
export class LembretesModule {}
