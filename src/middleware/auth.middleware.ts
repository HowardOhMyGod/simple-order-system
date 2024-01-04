import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { isNil } from 'lodash';
import { verify } from 'jsonwebtoken';
import CONST from '../config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const header = req.headers.authorization;
      if (isNil(header)) throw new UnauthorizedException();

      const [tokenType, token] = header.split(' ');
      if (tokenType !== 'Bearer') throw new UnauthorizedException();

      const payload = verify(token, CONST.JWT_SECRET);
      req['user'] = payload['data'];
      next();
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
