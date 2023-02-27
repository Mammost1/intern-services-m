/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get } from '@nestjs/common';

@Controller()
export class ExampleController {

    constructor() { }

    @Get()
    index() {
        return {
            service_name: 'ExampleController'
        };
    }

}
