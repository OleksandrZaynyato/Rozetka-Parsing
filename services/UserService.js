import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config.js";
import path from "node:path";

import User from "../models/UserModel.js";
import {ViewFilePath} from "../ViewFilePath.js";


export class UserService{
    constructor(dirname){
        this.dirname = dirname;
        this.registration = this.registration.bind(this);
        this.login = this.login.bind(this);
        this.loginWithPhone = this.loginWithPhone.bind(this);
        this.getRegistrationPage = this.getRegistrationPage.bind(this);
        this.getLoginPage = this.getLoginPage.bind(this);
        this.logout = this.logout.bind(this);
        this.updateChatId = this.updateChatId.bind(this);
        this.getUserByTgChatId = this.getUserByTgChatId.bind(this);
    }
    async registration(req, res){
        // console.log(req)
        try{
            const { username, password, confirmPassword, phoneNumber } = req.body;
            console.log(username, password, confirmPassword, phoneNumber)
            const candidate = await User.findOne({username});
            if (candidate) {
                return res.status(400).json({message: "Користувач з таким іменем уже зареєстрований"});
            }

            const phonePattern = /^\+380\d{9}$/;

            if (!phonePattern.test(phoneNumber)) {
                return res.status(400).json({ error: 'Некоректний номер! Використовуйте формат +380XXXXXXXXX' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({message: "Паролі не співпадають"});
            }
            let hashPassword = bcrypt.hashSync(password, 3);

            const user = new User({
                username,
                password: hashPassword,
                phoneNumber
            })
            await user.save();

            const token = jwt.sign({ id: user._id }, config.secret, { expiresIn: "1h" });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true, // Використовуйте лише через HTTPS
                sameSite: 'strict',
                maxAge: 3600000, // 1 година
            });

            return res.status(201).json({ message: "Користувач успішно зареєстрований" });

        } catch (e) {
            console.log(e);
            res.status(500).json("Registration error")
        }
    }
    async login(req, res){
        try{
            const { username, password } = req.body;
            const user = await User.findOne({username});
            if (!user) {
                return res.status(400).json({message: "Користувач не знайдений"});
            }

            let comparePassword = bcrypt.compareSync(password, user.password);
            if (!comparePassword) {
                return res.status(400).json({message: "Невірний пароль"});
            }

            const token = jwt.sign({id: user._id}, config.secret, {expiresIn: "1h"});

            res.cookie('token', token, {
                httpOnly: true,
                secure: true, // Використовуйте лише через HTTPS
                sameSite: 'strict',
                maxAge: 3600000, // 1 година
            });

            return res.status(201).json({ message: "Користувач успішно логінізувався" });
        } catch (e) {
            res.status(500).json("Login error")
        }
    }

    async loginWithPhone(req, res){
        try {
            const {phoneNumber} = req.body;
            const user = await User.findOne({phoneNumber});
            return res.status(200).json({message: "Користувач успішно залогінений"});
            if (!user) {
                return res.status(400).json({message: "Користувач не знайдений"});
            }
        } catch (e) {
            res.status(500).json("Login error")
        }
    }


    async logout(req, res){
        res.clearCookie('token');
        res.status(200).json({message: "Користувач вийшов з системи"});
    }

    async updateChatId(req, res){
        try {
            const {phoneNumber, tgChatId} = req.body;
            const user = await User.updateOne( {phoneNumber: phoneNumber}, {tgChatId: tgChatId});
        } catch (e) {
            res.status(500).json("Update phone number error")
        }
    }

    async getUserByTgChatId(req, res){
        try {
            const tgChatId = req.body.tgChatId;
            const user = await User.findOne({tgChatId});
            res.status(200).json(user);
        } catch (e) {
            res.status(500).json("Get user by phone number error")
        }
    }

    async getRegistrationPage(req, res){
        res.render(path.join(this.dirname, ViewFilePath.registration))
    }

    async getLoginPage(req, res){
        res.render(path.join(this.dirname, ViewFilePath.login))
    }
}