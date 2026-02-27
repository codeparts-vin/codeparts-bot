import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

async function sendMessage(user_id, text, buttons = null) {
  const body = {
    user_id,
    text
  };

  if (buttons) {
    body.attachments = [{
      type: "inline_keyboard",
      buttons
    }];
  }

  await fetch("https://platform-api.max.ru/messages", {
    method: "POST",
    headers: {
      "Authorization": BOT_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

/* ---------------- HEALTH ---------------- */

app.get("/health", (req, res) => {
  res.send("OK");
});

/* ---------------- WEBHOOK ---------------- */

app.post("/webhook", async (req, res) => {
  const update = req.body;

  try {

    /* === BOT START === */

    if (update.update_type === "bot_started" || update.bot_started) {

      const user =
        update.user?.user_id ||
        update.bot_started?.user?.user_id ||
        update.sender?.user_id;

      if (!user) return res.sendStatus(200);

      await sendMessage(
        user,
        "Добро пожаловать в CODEPARTS 🚗\nВыберите действие:",
        [[{ type: "callback", text: "Подобрать по VIN", payload: "vin" }]]
      );

      return res.sendStatus(200);
    }

    /* === BUTTON CLICK === */

    if (update.update_type === "message_callback") {

      const user = update.user?.user_id || update.sender?.user_id;
      const payload = update.payload;

      if (payload === "vin") {
        await sendMessage(user,
          "Введите:\n\nVIN\nМарку\nМодель\nГод\nОбъём двигателя"
        );
      }

      return res.sendStatus(200);
    }

    /* === VIN INPUT === */

    if (update.update_type === "message_created") {

      const user = update.user?.user_id || update.sender?.user_id;
      const text = update.message?.text;

      if (!user || !text) return res.sendStatus(200);

      if (text.length >= 17) {
        await sendMessage(user,
          "Спасибо 👍\nМенеджер уже подбирает запчасти.\n\nОжидайте варианты:\n• Оригинал\n• Оптимальный\n• Бюджет"
        );
      }

      return res.sendStatus(200);
    }

  } catch (e) {
    console.error("Webhook error:", e);
  }

  res.sendStatus(200);
});

/* ---------------- START ---------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
