import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDTO } from './dto/login.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/login')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDTO) {
    return this.appService.login(loginDto.username, loginDto.password);
  }
}
