import { Inject, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import * as _ from 'lodash';
import { Product } from './view/product.view';

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
      'INSERT INTO `product` (`name`,`price`,`stock`, `creator_id`) VALUES (?,?,?,?)',
      [product.name, product.price, product.stock, creatorId],
    );

    product.id = results.insertId;
    return product;
  }
}
