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
import {
  CreateProductDTO,
  GetProductsDTO,
  UpdateProductDTO,
} from './dto/product.dto';
import { Product } from './view/product.view';
import { CreateOrderDTO, GetOrdersDTO } from './dto/order.dto';
import { Order } from './view/order.view';
import { Role } from './enum';

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

  async updateProduct(
    productId: number,
    userId: number,
    updateProductDTO: UpdateProductDTO,
  ): Promise<void> {
    try {
      const product = await this.appRepository.findProductById(productId);
      if (_.isNil(product)) throw new NotFoundException();

      if (_.isEmpty(updateProductDTO)) return;

      await this.appRepository.updateProduct(
        productId,
        userId,
        updateProductDTO,
      );
    } catch (err) {
      this.logger.error(`update product error: ${err}`);
      throw err;
    }
  }

  async getProducts(dto: GetProductsDTO): Promise<Product[]> {
    try {
      return this.appRepository.getProducts(dto);
    } catch (err) {
      this.logger.error(`get products error: ${err}`);
      throw err;
    }
  }

  async getOrders(
    dto: GetOrdersDTO,
    userId: number,
    userRoles: Role[],
  ): Promise<Order[]> {
    try {
      userId = userRoles.includes(Role.Manager) ? null : userId;
      const orderIds = await this.appRepository.getOrdersIds(dto, userId);
      if (_.isEmpty(orderIds)) return [];

      const orderProducts =
        await this.appRepository.getOrderProductsByOrderIds(orderIds);

      const orderGroups = _.groupBy(
        orderProducts,
        (product) => product.orderId,
      );
      const orders: Order[] = [];
      for (const [orderId, products] of Object.entries(orderGroups)) {
        orders.push({
          id: Number(orderId),
          products,
        });
      }
      return orders;
    } catch (err) {
      this.logger.error(`get orders error: ${err}`);
      throw err;
    }
  }

  async createOrder(userId: number, dto: CreateOrderDTO): Promise<void> {
    try {
      // check product id all exist
      const productIds = dto.products.map((product) => product.id);
      const products = await this.appRepository.findProductsByIds(productIds);
      if (productIds.length != products.length) {
        throw new NotFoundException('product not found');
      }

      // place order and check affected rows
      const productsMap: Map<number, Product> = new Map();
      products.forEach((product) => productsMap.set(product.id, product));

      await this.appRepository.createOrder(
        userId,
        dto.products.map((product) => ({
          id: product.id,
          quantity: product.quantity,
          name: productsMap.get(product.id).name,
          price: productsMap.get(product.id).price,
        })),
      );
    } catch (err) {
      this.logger.error(`create orders error: ${err}`);
      throw err;
    }
  }
}
