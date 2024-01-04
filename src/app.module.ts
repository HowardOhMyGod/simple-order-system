import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppRepository } from './app.repository';
import * as mysql from 'mysql2/promise';
import CONST from './config';
import { AuthMiddleware } from './middleware/auth.middleware';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './middleware/role.middleware';

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
      provide: 'MYSQL_CONNECTION',
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'product', method: RequestMethod.POST });
  }
}
