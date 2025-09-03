import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Mem0Service, AddMemoryInput } from './mem0.service';

@Controller('memory')
export class Mem0Controller {
  constructor(private readonly mem0: Mem0Service) {}

  @Get()
  async list(
    @Query('taskId') taskId?: string,
    @Query('userId') userId?: string,
    @Query('scope') scope?: 'task' | 'user' | 'project',
    @Query('q') q?: string,
    @Query('topK') topK?: string,
  ) {
    if (!this.mem0.isEnabled()) return [];
    const query = q ?? '';
    const results = await this.mem0.retrieve({
      query,
      taskId,
      userId,
      topKTask: Number(topK ?? '8'),
      topKUser: Number(topK ?? '3'),
    });
    return scope ? results.filter((r) => r.scope === scope) : results;
  }

  @Post()
  async add(@Body() body: AddMemoryInput) {
    await this.mem0.addMemory(body);
    return { ok: true };
  }

  @Put(':id')
  async edit(@Param('id') id: string, @Body() body: Partial<AddMemoryInput>) {
    // Minimal stub; a real implementation would update text/tags via Mem0 API
    return { ok: true, id, body };
  }

  @Post(':id/promote')
  async promote(@Param('id') id: string) {
    const ok = await this.mem0.promote(id);
    return { ok };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ok = await this.mem0.delete(id);
    return { ok };
  }
}
