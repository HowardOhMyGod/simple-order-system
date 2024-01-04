import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AppRepository } from './app.repository';
import { LoginView } from './view/login.view';
import * as _ from 'lodash';
import * as bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import CONST from './config';
import { CreateProductDTO } from './dto/product.dto';
import { Product } from './view/product.view';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('APP_REPOSITORY') private readonly appRepository: AppRepository,
  ) {}

  async login(username: string, password: string): Promise<LoginView> {
    try {
      const user = await this.appRepository.findUser(username);
      if (_.isNil(user)) throw new UnauthorizedException();

      // check hash
      const isPass = await bcrypt.compare(password, user.password);
      if (!isPass) throw new UnauthorizedException();

      // issue JWT token
      return {
        token: sign(
          {
            exp: Math.floor(Date.now() / 1000) + CONST.JWT_EXPIRE_MINUTES * 60,
            data: {
              userId: user.id,
              roles: [user.role],
            },
          },
          CONST.JWT_SECRET,
        ),
      };
    } catch (err) {
      this.logger.error(`login error: ${err}`);
      throw err;
    }
  }

  async createProduct(
    creatorId: number,
    createProductDTO: CreateProductDTO,
  ): Promise<Product> {
    try {
      return this.appRepository.createProduct(creatorId, createProductDTO);
    } catch (err) {
      this.logger.error(`create product error: ${err}`);
      throw err;
    }
  }

  async deleteProduct(productId: number, userId: number): Promise<void> {
    try {
      const product = await this.appRepository.findProductById(productId);
      if (_.isNil(product)) throw new NotFoundException();

      const orders = await this.appRepository.findOrdersByProductId(
        productId,
        0,
        1,
      );
      if (!_.isEmpty(orders))
        throw new BadRequestException('Existing order with the product');

      const results = await this.appRepository.deleteProduct(productId, userId);
      if (results.affectedRows <= 0) {
        throw new BadRequestException('The product has been deleted');
      }
    } catch (err) {
      this.logger.error(`delete product error: ${err}`);
      throw err;
    }
  }
}
