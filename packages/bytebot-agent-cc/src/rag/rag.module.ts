import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}

