import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDTO } from './dto/login.dto';
import { CreateProductDTO, UpdateProductDTO } from './dto/product.dto';
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

  @Delete('/product/:productId')
  @Roles(Role.Manager)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  deleteProduct(
    @Req() req: Request,
    @Param('productId', new ParseIntPipe()) productId: number,
  ) {
    return this.appService.deleteProduct(productId, req['user']['userId']);
  }

  @Put('/product/:productId')
  @Roles(Role.Manager)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.OK)
  updateProduct(
    @Req() req: Request,
    @Param('productId', new ParseIntPipe()) productId: number,
    @Body() updateProductDTO: UpdateProductDTO,
  ) {
    return this.appService.updateProduct(
      productId,
      req['user']['userId'],
      updateProductDTO,
    );
  }
}
