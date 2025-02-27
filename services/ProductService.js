import axios from "axios";
import * as cheerio from "cheerio";
import jwt from "jsonwebtoken";

import Item from "../models/ItemModel.js";
import User from "../models/UserModel.js";
import config from "../config.js";
import path from "node:path";
import { ViewFilePath } from "../ViewFilePath.js";
import { response } from "express";
import { Specification } from "../models/Specification.js";
import { Comment } from "../models/Comment.js";
import checkPriceChanges from "../tgBot.js";

export class ProductService {
    constructor(dirname) {
        this.dirname = dirname;
        this.getHomePage = this.getHomePage.bind(this);
        this.getProductPage = this.getProductPage.bind(this);
        this.getDataFromRozetka = this.getDataFromRozetka.bind(this);
        this.saveDataToDB = this.saveDataToDB.bind(this);
        this.addNewProduct = this.addNewProduct.bind(this);
        this.deleteProduct = this.deleteProduct.bind(this);
        this.getAllProductsByUserId1 = this.getAllProductsByUserId1.bind(this);
        this.checkPriceChangeForFetch = this.checkPriceChangeForFetch.bind(this);
    }

    async getHomePage(req, res) {
        try {
            const token = req.cookies.token;
            if (!token) {
                res.render(path.join(this.dirname, ViewFilePath.home), { isAuthenticated: false });
                return;
            }
            const userObject = jwt.verify(token, config.secret);
            const products = await this.getAllProductsByUserId(userObject.id);
            const isPriceChanged = await this.checkPriceChange(products, userObject.tgChatId);
            console.log(isPriceChanged);
            if (isPriceChanged.length !== 0) {
                const updatedProducts = await this.getAllProductsByUserId(userObject.id);
                res.render(path.join(this.dirname, ViewFilePath.home), { products: updatedProducts, user: userObject, isAuthenticated: true });
                return;
            }
            res.render(path.join(this.dirname, ViewFilePath.home), { products, user: userObject, isAuthenticated: true });
        } catch (error) {
            console.error(error);
        }
    }

    async getProductPage(req, res) {
        try {
            const token = req.cookies.token;
            if (!token) {
                res.render(path.join(this.dirname, ViewFilePath.home));
                return;
            }
            const userObject = jwt.verify(token, config.secret);
            const product = await this.getProductById(req.params.id);

            res.render(path.join(this.dirname, ViewFilePath.product), { product, user: userObject });
        } catch (error) {
            console.error(error);
        }
    }

    async getDataFromRozetka(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            let price = $(".product-price__big").text();
            if ($(".product-price__small").text()) {
                price = $(".product-price__small").text();
            }
            const discountPrice = $(".product-price__big-color-red").text();
            const title = $(".title__font:first").text();
            const status = $(".status-label").text().trim();
            const image = $(".main-slider__item img:first").attr("src");
            const link = url;

            const specificationUrl = url + "characteristics/";
            const specificationResponse = await axios.get(specificationUrl);
            const specification$ = cheerio.load(specificationResponse.data);
            const specifications = [];
            const specificationTable = specification$(".list.ng-star-inserted");
            specificationTable.children().each((i, elem) => {
                const specificationName = $(elem).find("dt").text();
                const specificationValue = $(elem).find("dd").text();
                const specification = new Specification(specificationName, specificationValue);
                specifications.push(specification);
            });

            const commentUrl = url + "comments/";
            const commentResponse = await axios.get(commentUrl);
            const comment$ = cheerio.load(commentResponse.data);
            const comments = [];
            const commentListContainer = comment$(".product-comments__list");
            commentListContainer
                .children()
                .filter("li")
                .find(".comment__inner")
                .each((i, elem) => {
                    const commentWriterName = $(elem).find(".d-block div.text-base").text();
                    const commentDate = $(elem).find(".d-block time.date").text();

                    let commentRating;
                    const commentRatingStyle = $(elem).find(".stars__rating").prop("style");
                    if (!commentRatingStyle) {
                        commentRating = 0;
                    } else {
                        const match = commentRatingStyle.width.match(/(\d+)%/); // Шукаємо число перед %
                        if (match) {
                            const number = parseInt(match[1], 10); // Преобразуємо в ціле число
                            commentRating = number / 20; // Ділимо на 20, щоб отримати рейтинг від 0 до 5
                        } else {
                            commentRating = 0;
                        }
                    }

                    let commentText = $(elem).find(".comment__body p").text();
                    let commentsLikes = $(elem).find(".vote-buttons-comments button:first span").text();
                    let commentsDislikes = $(elem).find(".vote-buttons-comments__vote--dislike span").text();
                    if (!commentText) {
                        commentText = undefined;
                    }
                    if (!commentsLikes) {
                        commentsLikes = 0;
                    }
                    if (!commentsDislikes) {
                        commentsDislikes = 0;
                    }
                    const comment = new Comment(commentWriterName, commentText, commentRating, commentDate, commentsLikes, commentsDislikes);

                    comments.push(comment);
                });

            const item = { title, price, discountPrice, status, image, link, specifications, comments };

            // const saveData = new Item(item);
            // const result = await saveData.save();
            // console.log(result);

            return item;
        } catch (error) {
            console.error(error);
        }
    }

    async saveDataToDB(item) {
        try {
            const saveData = new Item(item);
            const result = await saveData.save();
            console.log(result);
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    async updateUserProducts(user, productId) {
        try {
            user.products.push(productId);
            await user.save();
        } catch (error) {
            console.error(error);
        }
    }

    async checkAlreadyExistProduct(userId, productLink) {
        try {
            const products = await this.getAllProductsByUserId(userId);
            for (const product of products) {
                if (product.link === productLink) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async addNewProduct(req, res) {
        try {
            const url = req.body.url;
            const data = await this.getDataFromRozetka(url);
            const token = req.cookies.token;
            const userObject = jwt.verify(token, config.secret);
            const isAlreadyExist = await this.checkAlreadyExistProduct(userObject.id, url);
            if (isAlreadyExist) {
                res.status(400).json({ message: "Продукт вже наявний в списку" });
                return;
            }
            const result = await this.saveDataToDB(data);
            const productId = result._id;
            console.log(productId);
            const userFromDB = await User.findById(userObject.id);
            await this.updateUserProducts(userFromDB, productId);

            res.status(200).json({ message: "Продукт успішно додано" });
        } catch (error) {
            console.error(error);
        }
    }

    async getAllProductsByUserId1(req, res) {
        try {
            const userId = req.body.userId;
            const user = await User.findById(userId);
            const products = user.products;
            let productsInfo = [];
            let i = 0;
            for (let i = 0; i < products.length; i++) {
                const product = await this.getProductById(products[i]);
                product.number = i + 1;
                productsInfo.push(product);
            }
            // for (const productId of products) {
            //     i++
            //     const product = await this.getProductById(productId);
            //     product.number = i
            //     productsInfo.push(product);
            // }
            res.status(200).json(productsInfo);
        } catch (error) {
            console.error(error);
        }    }

    async getAllProductsByUserId(userId) {
        try {
            const user = await User.findById(userId);
            const products = user.products;
            let productsInfo = [];
            let i = 0;
            for (let i = 0; i < products.length; i++) {
                const product = await this.getProductById(products[i]);
                product.number = i + 1;
                productsInfo.push(product);
            }
            // for (const productId of products) {
            //     i++
            //     const product = await this.getProductById(productId);
            //     product.number = i
            //     productsInfo.push(product);
            // }
            return productsInfo;
        } catch (error) {
            console.error(error);
        }
    }

    async getProductById(id) {
        try {
            const product = await Item.findById(id);
            return product.toObject();
        } catch (error) {
            console.error(error);
        }
    }

    async deleteProduct(req, res) {
        try {
            const id = await req.body.id;
            const item = await Item.findById(id);
            const data = await Item.deleteOne(item);
            const data1 = await User.updateOne({ products: id }, { $pull: { products: id } });
            console.log(data);
            console.log(data1);

            res.status(200).json({ message: "Продукт успішно видалено" });
        } catch (error) {
            console.error(error);
        }
    }

    async checkPriceChangeForFetch(req, res) {
        try {
            const products = await this.getAllProductsByUserId(req.body.userId);
            const user = await User.findById(req.body.userId);
            const updatedProducts = await this.checkPriceChange(products, user.tgChatId);
            res.status(200).json(updatedProducts);
        } catch (error) {
            console.error(error);
        }
    }

    async checkPriceChange(productsList, tgChatId) {
        try {
            const products = productsList;
            const updatedProducts = [];
            for (const product of products) {
                const newPrice = await this.parsePrice(product.link);
                const newPriceInt = parseInt(newPrice.replace(/[^\d]/g, ""), 10);
                // const newPriceCurrency =newPrice
                let price = product.discountPrice;
                if (price === "\n" + "\n" + "                                    " || price === "" || price === "null" || price === "undefined") {
                    price = product.price;
                }
                const priceInt = parseInt(price.replace(/[^\d]/g, ""), 10);

                if (newPrice < priceInt) {
                    await Item.updateOne({ link: product.link }, { discountPrice: newPrice });
                    const updatedProduct = await Item.findOne({ link: product.link });
                    updatedProducts.push(updatedProduct);
                } else if (newPriceInt > priceInt) {
                    await Item.updateOne({ link: product.link }, { price: newPrice, discountPrice: "\n" + "\n" + "                                    " });
                    const updatedProduct = await Item.findOne({ link: product.link });
                    updatedProducts.push(updatedProduct);
                }
            }
            if (updatedProducts.length !== 0) {
                await checkPriceChanges(updatedProducts, tgChatId);
            }
            return updatedProducts;
        } catch (error) {
            console.error(error);
        }
    }

    async parsePrice(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const price = $(".product-price__big").text();
            return price;
        } catch (error) {
            console.error(error);
        }
    }
}
