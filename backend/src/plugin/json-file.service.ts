import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JsonFileService {
  private readonly SRC_PATH = path.join(__dirname, '..', '..', 'src');

  public readFile(filePath: string): any {
    const rawData = fs.readFileSync(path.join(this.SRC_PATH, filePath), 'utf8');
    return JSON.parse(rawData);
  }

  public hasFile(filePath: string): boolean {
    return fs.existsSync(path.join(this.SRC_PATH, filePath));
  }
}
