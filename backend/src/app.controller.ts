//app.controller.ts
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller('test')
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get('/hello')
  testhello() : string{
	return'Hello World';
  }

  
  @Get('/')
  testHeaders(@Req() req: Request, @Res() res: Response): void {
    const headers = req.headers;
    res.status(210);
    res.send(headers);
    //   res.send('hello');
  }


  @Get('/status')
  getLoggin(): string {
    return 'logged in';
  }
}
