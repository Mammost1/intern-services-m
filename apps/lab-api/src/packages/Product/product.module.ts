
/*
https://docs.nestjs.com/modules
*/
// yntiefdwjpdgddkc
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { JwtModule } from '@nestjs/jwt'
import { MailerModule } from '@nestjs-modules/mailer/dist/mailer.module';

@Module({
    imports: [JwtModule,
       MailerModule.forRoot({
        transport:{
          host: 'smtp.gmail.com',
          port: 465,
  secure: true,
          auth:{
            user: "kosefefe@gmail.com",
            pass: "yntiefdwjpdgddkc"
          }
        }
       })
      ],
    controllers: [
        ProductController
    ],
    providers: [],
})
export class ProductModule { }
