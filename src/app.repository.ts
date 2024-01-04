import { Inject, Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import * as _ from 'lodash';

@Injectable()
export class AppRepository {
  constructor(@Inject('CONNECTION') private readonly conn) {}

  async findUser(username: string): Promise<RowDataPacket> {
    const [results] = await this.conn.execute(
      'SELECT `id`,`username`,`password`,`role` FROM `user` WHERE `username` = ?',
      [username],
    );
    return _.head(results);
  }
}
