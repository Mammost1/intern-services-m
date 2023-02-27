import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt'
import * as fs from 'fs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {

  }
  canActivate(
    context: ExecutionContext,
  ) {
   // console.log('FUUUUUUU')
    const request = context.switchToHttp().getRequest();
   // console.log(request.headers)
    const authorization = request.headers['authorization'] || request.headers['Authorization'] as string;
   // console.log(authorization)
    if (!authorization) {
      throw new HttpException('Case 1', HttpStatus.FORBIDDEN)
    } else if (!/^Bearer/.test(authorization)) {
      throw new HttpException('Case 2', HttpStatus.FORBIDDEN)
    }
    const token = authorization.split(' ')[1]

    if (token) {
     // console.log(token)
      fs.readdirSync('./').forEach(file => {
        //console.log(file)
      })
      const cert = fs.readFileSync('./cert/PUBLIC.key', { encoding: 'utf-8'}) as any;
      //console.log(cert)
      try{const data = this.jwtService.verify(token, {
        algorithms: ['RS512'],
        publicKey: cert
      })

      return data
      }
      catch{
        throw new HttpException('error', HttpStatus.UNAUTHORIZED)
      }


    }
    throw new HttpException('Case 3', HttpStatus.FORBIDDEN)
  }
}
