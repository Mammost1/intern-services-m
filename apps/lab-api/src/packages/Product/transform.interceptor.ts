import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException, HttpStatus } from "@nestjs/common";
import moment = require("moment");
import { map, Observable, of } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt'
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { join } from 'path'
import { json } from "stream/consumers";
export interface Response<T> {
    data: T;
}

@Injectable()
export class TransformationInterceptor implements NestInterceptor  {
  constructor(private jwtService: JwtService)  {

  }
    intercept(context: ExecutionContext, next: CallHandler): any {
    return  next.handle().pipe(
      map((flow) => {
        let datas
        let token



        const request = context.switchToHttp().getRequest();
        // const Request = context.switchToHttp().getResponse();
        const authorization = request.headers['authorization'] || request.headers['Authorization'] as string;
        const day = moment().format('DD/MM/YYYY hh:mm:ss a');
        let  cert
        if (authorization) {
          // console.log(request.url.split('/')[4]);
        if (request.url == '/services/lab-api/product/refreshToken') {
         token = flow.refresh_token
         cert = fs.readFileSync('./cert/privatetokenrefresh.key', { encoding: 'utf-8'}) as any;

        }else if (authorization) {
           token = authorization.split(' ')[1]
           cert = fs.readFileSync('./cert/PUBLIC.key', { encoding: 'utf-8'}) as any;

        }else{
          token = flow.refresh_token
          cert = fs.readFileSync('./cert/privatetokenrefresh.key', { encoding: 'utf-8'}) as any;
        }

          datas = this.jwtService.verify(token, {
          algorithms: ['RS512'],
          publicKey: cert
        })

        if (datas.role == 'Admin') {
            fs.readFile('filelistlogAdmin.txt', 'utf-8', function(err, data){
                              if (err) throw err;

                              var newValue = data.replace(/^\./gim, 'myString');
                              if (newValue == '') {
                                fs.writeFile('filelistlogAdmin.txt',` [${day}] [${datas.role}] [${request.url.split('/')[4]}] [${request.url}]  [Input :${JSON.stringify(request.body)}]   [Output :${JSON.stringify(flow)}]`   , 'utf-8', function (err) {
                                  if (err) throw err;
                                });
                              }else{
                                fs.writeFile('filelistlogAdmin.txt', newValue +'\n' +` [${day}] [${datas.role}] [${request.url.split('/')[4]}]  [${request.url}]  [input :${JSON.stringify(request.body)}]   [Output :${JSON.stringify(flow)}]` , 'utf-8', function (err) {
                                if (err) throw err;
                              });
                              }

                            });
        }else{
          fs.readFile('filelistloguser.txt', 'utf-8', function(err, data){
            if (err) throw err;

            var newValue = data.replace(/^\./gim, 'myString');
            if (newValue == '') {
              fs.writeFile('filelistloguser.txt',` [${day}] [${datas.role}] [${request.url.split('/')[4]}]  [${request.url}] [Input :${JSON.stringify(request.body)}]   [Output :${JSON.stringify(flow)}]`   , 'utf-8', function (err) {
                if (err) throw err;
              });
            }else{
              fs.writeFile('filelistloguser.txt', newValue +'\n' +` [${day}] [${request.url.split('/')[4]}] [${request.method}]  [${request.url}]  [input :${JSON.stringify(request.body)}]   [Output :${JSON.stringify(flow)}]` , 'utf-8', function (err) {
              if (err) throw err;
            });
            }

          });
        }}else {
          fs.readFile('filelistlogAdmin.txt', 'utf-8', function(err, data){
            if (err) throw err;

            var newValue = data.replace(/^\./gim, 'myString');
            if (newValue == '') {
              fs.writeFile('filelistlogAdmin.txt',` [${day}] [Admin] [${request.url.split('/')[4]}] [${request.url}]  [Input :${JSON.stringify(request.body)}]   [Output :${JSON.stringify(flow)}]`   , 'utf-8', function (err) {
                if (err) throw err;
              });
            }else{
              fs.writeFile('filelistlogAdmin.txt', newValue +'\n' +` [${day}] [Admin] [${request.url.split('/')[4]}]  [${request.url}]  [input :${JSON.stringify(request.body)}]   [Output :${JSON.stringify(flow)}]` , 'utf-8', function (err) {
              if (err) throw err;
            });
            }

          });
        }
        return flow
      }),
      catchError((e) => {
        let datas
        let token
        const request = context.switchToHttp().getRequest();

        const authorization = request.headers['authorization'] || request.headers['Authorization'] as string;

     const day = moment().format('DD/MM/YYYY hh:mm:ss a');
     let  cert

     if (authorization) {
        if (request.url == '/services/lab-api/product/refreshToken') {
         token = e.refresh_token
         cert = fs.readFileSync('./cert/privatetokenrefresh.key', { encoding: 'utf-8'}) as any;

        }else if (authorization) {
           token = authorization.split(' ')[1]
           cert = fs.readFileSync('./cert/PUBLIC.key', { encoding: 'utf-8'}) as any;

        }else{
          token = e.refresh_token
          cert = fs.readFileSync('./cert/privatetokenrefresh.key', { encoding: 'utf-8'}) as any;
        }

          datas = this.jwtService.verify(token, {
          algorithms: ['RS512'],
          publicKey: cert
        })
         if (datas.role == 'Admin') {
          fs.readFile('filelistlogAdmin.txt', 'utf-8', function(err, data){
                  if (err) throw err;

                  var newValue = data.replace(/^\./gim, 'myString');
                  if (newValue == '') {
                    fs.writeFile('filelistlogAdmin.txt',` [Error]  [${day}] [${datas.role}] [${request.url.split('/')[4]}]  [${request.url}]   [Error message :${e.message}]`     , 'utf-8', function (err) {
                      if (err) throw err;
                    });
                  }else{
                    fs.writeFile('filelistlogAdmin.txt', newValue +'\n' +` [Error]  [${day}] [${datas.role}] [${request.url.split('/')[4]}]  [${request.url}]   [Error message :${e.message}]`   , 'utf-8', function (err) {
                    if (err) throw err;
                  });
                  }

                });
         }else{
          fs.readFile('filelistloguser.txt', 'utf-8', function(err, data){
            if (err) throw err;

            var newValue = data.replace(/^\./gim, 'myString');
            if (newValue == '') {
              fs.writeFile('filelistloguser.txt',` [Error]  [${day}] [${datas.role}] [${request.url.split('/')[4]}]  [${request.url}]     [Error message :${e.message}]`     , 'utf-8', function (err) {
                if (err) throw err;
              });
            }else{
              fs.writeFile('filelistloguser.txt', newValue +'\n' +` [Error]  [${day}] [${datas.role}] [${request.url.split('/')[4]}]  [${request.url}]   [Error message :${e.message}]`   , 'utf-8', function (err) {
              if (err) throw err;
            });
            }

          });
         }}
         else{
          fs.readFile('filelistlogAdmin.txt', 'utf-8', function(err, data){
            if (err) throw err;

            var newValue = data.replace(/^\./gim, 'myString');
            if (newValue == '') {
              fs.writeFile('filelistlogAdmin.txt',` [Error]  [${day}] [Admin] [${request.url.split('/')[4]}]  [${request.url}]   [Error message :${e.message}]`     , 'utf-8', function (err) {
                if (err) throw err;
              });
            }else{
              fs.writeFile('filelistlogAdmin.txt', newValue +'\n' +` [Error]  [${day}] [Admin] [${request.url.split('/')[4]}]  [${request.url}]   [Error message :${e.message}]`   , 'utf-8', function (err) {
              if (err) throw err;
            });
            }

          });
         }
        throw e
      })
    )
    }

}
