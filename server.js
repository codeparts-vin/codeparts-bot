import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

async function sendMessage(user_id, text, buttons=null) {

    let body = { text };

    if(buttons){
        body.attachments = [{
            type:"inline_keyboard",
            payload:{buttons}
        }];
    }

    await fetch("https://platform-api.max.ru/messages?user_id="+user_id,{
        method:"POST",
        headers:{
            "Authorization":BOT_TOKEN,
            "Content-Type":"application/json"
        },
        body: JSON.stringify(body)
    });
}

app.post("/webhook", async (req,res)=>{

    const update = req.body;

    if(update.message){

        const user = update.message.sender.user_id;
        const text = update.message.body?.text;

        if(text == "/start"){

            await sendMessage(user,
            "Добро пожаловать в CODEPARTS 🚗\nВыберите действие:",
            [[{type:"callback",text:"Подобрать по VIN",payload:"vin"}]]
            );

        }

        if(text?.length == 17){

            await sendMessage(user,
            "Введите список нужных запчастей"
            );

        }

    }

    if(update.callback){

        const user = update.callback.user.user_id;
        const payload = update.callback.payload;

        if(payload == "vin"){
            await sendMessage(user,"Введите VIN автомобиля");
        }

    }

    res.send("ok");
});

app.listen(3000);
