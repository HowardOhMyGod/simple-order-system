import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDTO } from './dto/login.dto';
import { CreateProductDTO } from './dto/product.dto';
import { Role } from './enum';
import { Roles } from './decorator/role.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/login')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDTO) {
    return this.appService.login(loginDto.username, loginDto.password);
  }

  @Post('/product')
  @Roles(Role.Manager)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  createProduct(
    @Req() req: Request,
    @Body() createProductDTO: CreateProductDTO,
  ) {
    return this.appService.createProduct(
      req['user']['userId'],
      createProductDTO,
    );
  }
}
