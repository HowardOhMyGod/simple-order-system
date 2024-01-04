import { Inject, Injectable } from '@nestjs/common';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import * as _ from 'lodash';
import { Product } from './view/product.view';
import { OrderProduct } from './view/order.view';
import { GetProductsDTO, UpdateProductDTO } from './dto/product.dto';

@Injectable()
export class AppRepository {
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
      'INSERT INTO `product` (`name`,`price`,`stock`, `last_udpate_user_id`) VALUES (?,?,?,?)',
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
}
