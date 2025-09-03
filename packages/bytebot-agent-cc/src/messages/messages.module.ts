import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { Mem0Module } from '../mem0/mem0.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TasksModule), Mem0Module],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
