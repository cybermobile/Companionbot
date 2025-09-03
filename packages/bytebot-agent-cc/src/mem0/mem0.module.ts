import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Mem0Service } from './mem0.service';
import { Mem0Controller } from './mem0.controller';

@Module({
  imports: [ConfigModule],
  providers: [Mem0Service],
  exports: [Mem0Service],
  controllers: [Mem0Controller],
})
export class Mem0Module {}
