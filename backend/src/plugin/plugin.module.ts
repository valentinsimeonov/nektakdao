import { Module } from '@nestjs/common';
import { JsonFileService } from './json-file.service';

@Module({
  providers: [JsonFileService],
  exports: [JsonFileService],
})
export class PluginModule {}
