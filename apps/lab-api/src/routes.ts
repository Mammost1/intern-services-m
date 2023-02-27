import { Routes } from "@nestjs/core";

import { ProductModule } from "./packages/Product/product.module";

// global prefix => /services/lab-api
// ex. https://domain.com/services/lab-api/example

export const routes: Routes = [
    // {
    //     path: "example",
    //     module: ExampleModule
    // },
    {
        path: "product",
        module: ProductModule
    }
]
