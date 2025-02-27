import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import * as path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import hbs from 'hbs';

import Item from './models/ItemModel.js';
import {registerUserRouter} from "./routes/userRouter.js";
import {UserService} from "./services/UserService.js";
import {registerProductRouter} from "./routes/productRouter.js";
import {ProductService} from "./services/ProductService.js";
import {ViewFilePath} from "./ViewFilePath.js";

dotenv.config();

const app = express();
app.set("view engine", "hbs");
hbs.registerHelper('eq', (a, b) =>{
    return a === b
} );
hbs.registerHelper('gte', function (a, b) {
    return a >= b;
});

const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const userService = new UserService(__dirname);
const productService = new ProductService(__dirname);





app.use(express.static(path.join(__dirname, "public")));
hbs.registerPartials(__dirname + "/public/partials");

app.use(express.json());
app.use(cors());
app.use(cookieParser())

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.log('Error:', error);
})

// app.get('/', (req, res) => {
//     res.render(path.join(__dirname, ViewFilePath.home));
// });

const userRouter = express.Router();
registerUserRouter(userRouter, userService);
app.use('/user', userRouter);

const productRouter = express.Router();
registerProductRouter(productRouter, productService);
app.use('/', productRouter);

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}: http://localhost:${PORT}`);
})