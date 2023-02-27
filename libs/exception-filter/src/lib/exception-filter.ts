import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import * as moment from 'moment';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt'
import * as fs from 'fs';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // constructor(private jwtService: JwtService) {

  // }
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request: Request = ctx.getRequest();
    let user_agent: string = 'unknown';
    let ip: string = 'unknown';
    let code = -1;
    //@Get User Agent
    try {
      user_agent = request.headers['user-agent'] || 'unknown';
    } catch (err) {}
    //@Get Ip Address
    try {
      ip = `x-forwarded-for: ${request.headers['x-forwarded-for']}, x-real-ip: ${request.headers['x-real-ip']}`;
    } catch (err) {}
    var status = HttpStatus.BAD_REQUEST;
    // console.log(exception)
    try {
      status = exception.getStatus();
    } catch (err) {
      status = HttpStatus.BAD_REQUEST;
    }

    var message = exception.message;
    // console.log(exception.message)
    try {
      code = exception.response.hasOwnProperty('code')
        ? exception.response.code
        : code;
    } catch (err) {}
    if (typeof exception.message == 'object') {
      try {
        if (exception.message.message) {
          message = exception.message.message;
        }
      } catch (err) {}
      try {
        if (exception.message.error) {
          message = exception.message.error;
        }
      } catch (err) {}
    }

    let model = {
      statusCode: status,
      code: code,
      stack: exception.stack,
      message: message,
      dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      timestamp: Date.now(),
      path: request.url,
      ip: ip,
      userAgent: user_agent,
    };
    console.log(model);
    model['stack'] = null;
    if (
      `${model.message}`.search('ER_') !== -1 &&
      `${model.stack}`.search('Client_MySQL') !== -1
    ) {
      model['message'] = '[Unknown][Query] Please check logs';
    }


    response.status(status).json(model);
  }
}

