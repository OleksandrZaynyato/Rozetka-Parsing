import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    title: String,
    price: String,
    discountPrice: String,
    image: String,
    status: String,
    link: String,
    specifications: [{
        name: String,
        value: String
    }],
    comments: [{
        writerName: String,
        content: String,
        rating: Number,
        date: String,
        likes: Number,
        dislikes: Number
    }]
})
const Item = mongoose.model('Item', itemSchema);
export default Item;