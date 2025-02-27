import mongoose from "mongoose";
import e from "express";

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, require: true },
    password: { type: String, unique: false, require: true },
    phoneNumber: { type: String, unique: true, require: true },
    tgChatId: { type: Number, unique: true, require: false },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        id: {
            type: String,
            require: true
        },
        ref: "Product",
    }]
})

const User = mongoose.model("User", userSchema);

export default User;