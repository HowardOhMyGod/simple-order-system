import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppRepository } from './app.repository';
import * as mysql from 'mysql2/promise';
import CONST from './config';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_REPOSITORY',
      useClass: AppRepository,
    },
    {
      provide: 'CONNECTION',
      useFactory: async () => {
        const connection = await mysql.createConnection({
          host: CONST.MYSQL_HOST,
          user: CONST.MYSQL_USER,
          database: CONST.MYSQL_DATABASE,
          password: CONST.MYSQL_PASSWORD,
        });
        return connection;
      },
    },
  ],
})
export class AppModule {}
