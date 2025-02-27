# Rozetka-Parsing🛒

## 📖 Description
This project is a web application for online shopping that allows users to add items to a cart, view them, adjust quantities, and place orders. The project is built using modern web technologies for a seamless user experience.

## 🚀 Features
- Add products to the cart
- View selected products
- Remove products
- Place an order
- Cart persistence between sessions
- Find out about price changes

## 🛠 Technologies
- **Frontend:** HTML, CSS (Grid/Flexbox), JavaScript
- **Backend:** Node.js, Express.js, cheerio
- **Database:** MongoDB
- **Template Engine:** hbs

## 📌 Installation
1. Clone the repository:
   ```sh
   git clone [https://github.com/user/online-cart.git](https://github.com/OleksandrZaynyato/Rozetka-Parsing.git)
   ```
2. Install dependencies:
   ```sh
   npm install axios bcryptjs cheerio cookie-parser cors dotenv express hbs jsonwebtoken mongoose node-telegram-bot-api nodemon
   ```
3. Init your tg bot at @BotFather
3. Add these variable to .env
   ```sh
   MONGODB_URL - // to connect your database
   SECRET_KEY - // to hesh paswords
   PORT=3000 - // PORT
   TG_BOT_TOKEN - // token to get access to your tg bot
   ```
5. Start the server:
   ```sh
   npm start
   ```

## 🎯 Usage
After launching, open in your browser:
```
http://localhost:3000
```

## 📜 License
This project is licensed under the MIT License.

