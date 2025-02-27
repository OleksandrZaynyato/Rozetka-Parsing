import express from "express";
import path from "node:path";

import { ProductService} from "../services/ProductService.js";
import { __dirname } from "../index.js";

// const productService = new ProductService();

// export const itemRouter = express.Router();

// itemRouter.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'homePage', 'index.hbs'));
// });

// itemRouter.post('/url-parse', async (req, res) => {
    // const url = req.body.url
    // console.log(url);
    // const item = await productService.getDataFromRozetka(url);
    // if (!item) {
    //     res.status(404).send("It's not found" );
    // }
    // res.status(200).json(item);
// })

export function registerProductRouter(router, productService) {
    router.get('/', productService.getHomePage);
    router.get('/product/:id', productService.getProductPage);
    router.post('/product/add', productService.addNewProduct);
    router.post('/product/get-all-by-user-id', productService.getAllProductsByUserId1);
    router.get('/product/get/:id', productService.getProductById);
    router.delete('/product/delete', productService.deleteProduct);
    router.post('/product/is-changed', productService.checkPriceChangeForFetch);
}

