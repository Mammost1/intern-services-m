/*
https://docs.nestjs.com/middleware#middleware
*/

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as getUUID from 'uuid';

@Injectable()
export class NestRequestId implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    try{
      req.headers['request-id'] = getUUID.v1();
      res.append('request-id',req.headers['request-id'])
      next();
    }catch(err){
      console.log('error addRequestId');
      next();
    }
  }
}
