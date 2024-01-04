import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AppRepository } from './app.repository';
import { LoginView } from './view/login.view';
import * as _ from 'lodash';
import * as bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import CONST from './config';

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
              role: user.role,
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
}
