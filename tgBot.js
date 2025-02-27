import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

const token = process.env.TG_BOT_TOKEN;

const commands = [
    { command: "/start", description: "Start" },
    { command: "/help", description: "Help" },
    // { command: "/checkPriceChanges", description: "Check price changes" },
];

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands(commands);

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId);
    await bot.sendMessage(chatId, "Будь ласка, поділіться своїм номером телефона:", {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: "Поділитися номером телефона",
                        request_contact: true // Запитує номер телефону користувача
                    }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

bot.on('contact', async (msg) => {
    if (msg.contact && msg.contact.phone_number) {
        const phoneNumber = msg.contact.phone_number;
        console.log(`Номер телефону: ${phoneNumber}`);
        const tgChatId = msg.chat.id;

        const responce =  await fetch('http://localhost:3000/user/loginWithPhone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                credentials: 'include'
            },
            body: JSON.stringify({phoneNumber})
        })
        if (responce.ok) {
            await fetch('http://localhost:3000/user/update-chat-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    credentials: 'include'
                },
                body: JSON.stringify({phoneNumber, tgChatId})
            })
            bot.sendMessage(tgChatId, "Ласкаво просимо. Тут ви будете отримувати повідомлення про зміни цін на продукти, які ви додали в свої списки.");

        }
        console.log("User phone number: ", phoneNumber);
    }
});

bot.onText(/\/help/, (msg) => {
    const helpMessage = commands.map((command) => `${command.command} - ${command.description}`).join("\n");
    bot.sendMessage(msg.chat.id, helpMessage);
});

const checkPriceChanges = async (changedProducts, tgChatId) => {
    const message = changedProducts.map((product) => `У продукті <i>${product.title}</i> змінилась ціна: <b>${product.price}</b>`).join("\n");
    bot.sendMessage(tgChatId, message, { parse_mode: "HTML" });
};

bot.onText(/\/checkPriceChanges/, async (msg) => {
    const response = await fetch('http://localhost:3000/user/get-user-by-tg-chat-id', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            credentials: 'include'
        },
        body: JSON.stringify({tgChatId: msg.chat.id})
    });
    const user = await response.json();
    console.log(user._id);

    // const productsResponse = await fetch('http://localhost:3000/product/get-all-by-user-id', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         credentials: 'include'
    //     },
    //     body: JSON.stringify({userId: user._id})
    // });
    //
    // const products = await productsResponse.json();

    const changedProductsResponse = await fetch('http://localhost:3000/product/is-changed', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            credentials: 'include'
        },
        body: JSON.stringify({userId: user._id})
    });

    const changedProducts = await changedProductsResponse.json();

    if (changedProducts.length === 0 || changedProducts === undefined || changedProducts === null || !changedProducts) {
        bot.sendMessage(msg.chat.id, "Ціни на всі продукти залишились незмінними.");
    }
})

export default checkPriceChanges;
