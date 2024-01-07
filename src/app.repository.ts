import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import * as _ from 'lodash';
import { Product } from './view/product.view';
import { OrderProduct } from './view/order.view';
import { GetProductsDTO, UpdateProductDTO } from './dto/product.dto';
import { GetOrdersDTO } from './dto/order.dto';

@Injectable()
export class AppRepository {
  private readonly logger = new Logger(AppRepository.name);

  constructor(@Inject('MYSQL_CONNECTION') private readonly mysqlConn) {}

  async findUser(username: string): Promise<RowDataPacket> {
    const [results] = await this.mysqlConn.execute(
      'SELECT `id`,`username`,`password`,`role` FROM `user` WHERE `username` = ?',
      [username],
    );
    return _.head(results);
  }

  async createProduct(creatorId: number, product: Product): Promise<Product> {
    const [results] = await this.mysqlConn.execute(
      'INSERT INTO `product` (`name`,`price`,`stock`,`last_update_user_id`) VALUES (?,?,?,?)',
      [product.name, product.price, product.stock, creatorId],
    );

    product.id = results.insertId;
    return product;
  }

  async findProductById(productId: number): Promise<Product> {
    const [results] = await this.mysqlConn.execute(
      'SELECT `id`,`name`,`price`,`stock`,`active` FROM `product` WHERE `id` = ?',
      [productId],
    );
    return _.head(results);
  }

  async findProductsByIds(productIds: number[]): Promise<Product[]> {
    const [results] = await this.mysqlConn.query(
      'SELECT `id`,`name`,`price`,`stock`,`active` FROM `product` WHERE `id` IN (?)',
      [productIds],
    );
    return results;
  }

  async findOrdersByProductId(
    productId: number,
    page: number,
    size: number,
  ): Promise<OrderProduct[]> {
    const [results] = await this.mysqlConn.query(
      'SELECT `order_id`,`product_id`,`user_id`,`quantity`,`price` FROM `order_product` WHERE `product_id` = ? ORDER BY `user_id` LIMIT ? OFFSET ?',
      [productId, size, page * size],
    );

    return results.map((data: RowDataPacket) => ({
      userId: data.user_id,
      orderId: data.id,
      productId: data.product_id,
      quantity: data.quantity,
      price: data.price,
    }));
  }

  async deleteProduct(
    productId: number,
    userId: number,
  ): Promise<ResultSetHeader> {
    const [results] = await this.mysqlConn.execute(
      'UPDATE `product` SET active = 0, last_update_user_Id = ? WHERE `id` = ? AND active=1',
      [userId, productId],
    );
    return results;
  }

  async updateProduct(
    productId: number,
    userId: number,
    product: UpdateProductDTO,
  ): Promise<void> {
    const updates: string[] = [];
    const vals: any[] = [];
    for (const [field, val] of Object.entries(product)) {
      updates.push(`\`${field}\` = ?`);
      vals.push(val);
    }

    const query = `UPDATE \`product\` SET last_update_user_Id = ?, ${updates.join(
      ',',
    )} WHERE \`id\` = ?`;
    await this.mysqlConn.execute(query, [userId, ...vals, productId]);
  }

  async getProducts(filter: GetProductsDTO): Promise<Product[]> {
    let query = 'SELECT `id`,`name`,`price`,`stock`,`active` FROM `product`';

    const whereConds: string[] = [];
    const whereVals: any[] = [];
    for (const [field, val] of Object.entries(filter)) {
      if (field === 'page' || field === 'size') continue;
      whereConds.push(`\`${field}\` = ?`);
      whereVals.push(val);
    }

    if (!_.isEmpty(whereConds)) query += ` WHERE ${whereConds.join(' AND ')}`;

    query =
      query +
      ` ORDER BY \`id\` LIMIT ${filter.size} OFFSET ${
        filter.page * filter.size
      }`;
    const [results] = await this.mysqlConn.execute(query, whereVals);
    return results;
  }

  async getOrdersIds(filter: GetOrdersDTO, userId?: number): Promise<number[]> {
    let query = 'SELECT `id` FROM `order`';

    if (!_.isNil(userId)) {
      query += ` WHERE \`user_id\` = ${userId}`;
    }

    query += ` ORDER BY \`id\` DESC LIMIT ${filter.size} OFFSET ${
      filter.page * filter.size
    }`;
    const [results] = await this.mysqlConn.query(query);
    return results.map((data: RowDataPacket) => data.id);
  }

  async getOrderProductsByOrderIds(
    orderIds: number[],
  ): Promise<OrderProduct[]> {
    const [results] = await this.mysqlConn.query(
      'SELECT order_id,product_id,order_product.price,order_product.quantity,order_product.ctime,product.name FROM order_product JOIN product ON product.id = order_product.product_id WHERE order_id IN (?)',
      [orderIds],
    );
    return results.map((data: RowDataPacket) => ({
      orderId: data.order_id,
      productId: data.product_id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
    }));
  }

  async createOrder(
    userId: number,
    products: { id: number; name: string; price: number; quantity: number }[],
  ): Promise<any> {
    try {
      await this.mysqlConn.query('SET autocommit = 0');
      await this.mysqlConn.beginTransaction();

      let orderId: number = null;
      for (const product of products) {
        // update product and check stock
        const [result] = await this.mysqlConn.query(
          'UPDATE `product` SET `stock`=`stock`-? WHERE `id`=? AND `stock` >= ?',
          [product.quantity, product.id, product.quantity],
        );

        // optimistic lock
        if (result.affectedRows < 1) {
          await this.mysqlConn.rollback();
          this.logger.error(
            `mysql create order error: product ${product.id} out of stock`,
          );
          throw new BadRequestException(`product ${product.id} out of stock`);
        }

        // create order once
        if (_.isNil(orderId)) {
          const [order] = await this.mysqlConn.query(
            'INSERT INTO `order` (`user_id`) VALUES (?)',
            [userId],
          );
          orderId = order.insertId;
        }

        // create order product
        await this.mysqlConn.query(
          'INSERT INTO `order_product` (`user_id`,`order_id`,`product_id`,`quantity`,`price`) VALUES (?,?,?,?,?)',
          [userId, orderId, product.id, 1, product.price],
        );
      }
      await this.mysqlConn.commit();
    } catch (err) {
      await this.mysqlConn.rollback();
      if (!(err instanceof HttpException)) {
        this.logger.error(`mysql create order error: ${err}`);
        throw new Error(`mysql create order error`);
      }
      throw err;
    }
  }
}
