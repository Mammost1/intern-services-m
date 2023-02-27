/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { All, Get, Controller, HttpException, HttpStatus, Logger, MiddlewareConsumer, Module, ValidationPipe } from "@nestjs/common";
import { APP_INTERCEPTOR, NestFactory, RouterModule } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { environment } from "./environments/environment";
import { routes } from "./routes";
import * as os from 'os';
import { getHeapStatistics } from 'v8';
import { version } from "./environments/version";
import { AllExceptionsFilter } from "@internship/exception-filter";
import { NestRequestId } from "@internship/nest-request-id";
import { LoggingInterceptor } from '@algoan/nestjs-logging-interceptor';
import { TransformationInterceptor } from "./packages/Product/transform.interceptor";
import { JwtModule } from "@nestjs/jwt";

process.on('uncaughtException', function (reason, p) {
  //call handler here
  console.log(reason, p);
});

let modules = []
for(let module of routes){
  modules.push(module.module)
}

// global variables
global.signal_gracefulShutdown = false;

@Controller()
class mainController {
  constructor() {
    if (environment.NODE_ENV !== 'development') {
      // listen for TERM signal .e.g. kill
      process.on('SIGTERM', () => {
        this.gracefulShutdown();
      });
      // listen for INT signal e.g. Ctrl-C
      process.on('SIGINT', () => {
        this.gracefulShutdown();
      });
    }
  }

  gracefulShutdown() {
    //console.log(environment.NODE_ENV)
    global.signal_gracefulShutdown = true;
    setTimeout(() => {
      process.exit(0);
    }, environment.gracefulShutdownTime * 1000);
    if(environment.NODE_ENV == 'development'){
      process.exit(0);
    }
  }

   @Get()
   root() {
     return {
       service: environment.global_prefix,
       version: version,
       status: HttpStatus.OK,
       host: os.hostname()
     };
   }

  @All('status')
  health() {
    // throw new HttpError(resCode.SERVICE_UNAVAILABLE)
    if (!global.signal_gracefulShutdown) {
      return { version: version, status: HttpStatus.OK, host: os.hostname() };
    }
    throw new HttpException("SERVICE_UNAVAILABLE", HttpStatus.SERVICE_UNAVAILABLE)
  }

}

@Module({
  imports: [
    JwtModule,
    RouterModule.register(routes),
    ...modules
  ],
  controllers: [
    mainController
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformationInterceptor,
    },
  ]
})
export class mainModule {

	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(NestRequestId).forRoutes('**')
  }
}

async function bootstrap() {
  const port = process.env.PORT || environment.PORT;
	const app = await NestFactory.create<NestExpressApplication>(mainModule);
	app.enableCors();
  const globalPrefix = environment.global_prefix;
  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      'status'
    ]
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port).finally(()=>{
    Logger.log(process.pid + " is alive!", "Worker");
    Logger.log(process.cwd(), 'process.cwd() path');
    Logger.log(os.hostname(), "HOST_NAME")
    Logger.log(os.platform(), "platform")
    try{
      Logger.log(`${getHeapStatistics().heap_size_limit / (1024 * 1024)} Mb`, "node heap limit")
    }catch(err){
      Logger.log('node heap limit log error')
    }
    Logger.log(
      `🚀 Application is running on: http://localhost:${environment.PORT}/${globalPrefix}`
    );
	});
}

bootstrap();
