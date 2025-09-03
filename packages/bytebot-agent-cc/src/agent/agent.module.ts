import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { MessagesModule } from '../messages/messages.module';
import { AgentProcessor } from './agent.processor';
import { ConfigModule } from '@nestjs/config';
import { AgentScheduler } from './agent.scheduler';
import { InputCaptureService } from './input-capture.service';
import { AgentAnalyticsService } from './agent.analytics';
import { Mem0Module } from '../mem0/mem0.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [ConfigModule, TasksModule, MessagesModule, Mem0Module, RagModule],
  providers: [
    AgentProcessor,
    AgentScheduler,
    InputCaptureService,
    AgentAnalyticsService,
  ],
  exports: [AgentProcessor],
})
export class AgentModule {}
