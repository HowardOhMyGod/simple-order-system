import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDTO } from './dto/login.dto';
import {
  CreateProductDTO,
  GetProductsDTO,
  UpdateProductDTO,
} from './dto/product.dto';
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

  @Get('/products')
  @UsePipes(new ValidationPipe({transform: true}))
  async getProducts(@Query() getProductsDTO: GetProductsDTO) {
    const products = await this.appService.getProducts(getProductsDTO);
    return {
      data: products
    }
  }

  @Post('/product')
  @Roles(Role.Manager)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Req() req: Request,
    @Body() createProductDTO: CreateProductDTO,
  ) {
    const product = await this.appService.createProduct(
      req['user']['userId'],
      createProductDTO,
    );
    return {
      data: product
    }
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
