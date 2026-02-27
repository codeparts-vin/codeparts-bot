import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// 1) Health-check, чтобы проверять в браузере
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// 2) GET /webhook — чтобы в браузере не было "ошибка"
app.get("/webhook", (req, res) => {
  res.status(200).send("webhook is alive (use POST)");
});

async function sendMessage(user_id, text, buttons = null) {
  let body = { text };

  if (buttons) {
    body.attachments = [
      {
        type: "inline_keyboard",
        payload: { buttons },
      },
    ];
  }

  const r = await fetch("https://platform-api.max.ru/messages?user_id=" + user_id, {
    method: "POST",
    headers: {
      Authorization: BOT_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const t = await r.text();
  console.log("sendMessage status:", r.status, "resp:", t);
}

app.post("/webhook", async (req, res) => {
  console.log("=== INCOMING UPDATE ===");
  console.log(JSON.stringify(req.body, null, 2));

  const update = req.body;

  // ВАЖНО: сразу отвечаем 200 OK, чтобы MAX не ретраил
  res.status(200).send("ok");

  try {
    // Вариант 1: если MAX шлёт message
    if (update.message) {
      const user = update.message.sender?.user_id;
      const text = update.message.body?.text;

      if (!user) return;

      if (text === "/start") {
        await sendMessage(
          user,
          "Добро пожаловать в CODEPARTS 🚗\nВыберите действие:",
          [[{ type: "callback", text: "Подобрать по VIN", payload: "vin" }]]
        );
        return;
      }

      // если похоже на VIN (17 символов)
      if (text && text.length === 17) {
        await sendMessage(user, "Введите список нужных запчастей");
        return;
      }
    }

    // Вариант 2: если MAX шлёт callback
    if (update.callback) {
      const user = update.callback.user?.user_id;
      const payload = update.callback.payload;

      if (!user) return;

      if (payload === "vin") {
        await sendMessage(user, "Введите VIN автомобиля");
        return;
      }
    }

    // Вариант 3: если MAX шлёт bot_started (некоторые платформы так делают)
    if (update.type === "bot_started" || update.bot_started) {
      const user =
        update.user?.user_id ||
        update.bot_started?.user?.user_id ||
        update.sender?.user_id;

      if (!user) return;

      await sendMessage(
        user,
        "Добро пожаловать в CODEPARTS 🚗\nВыберите действие:",
        [[{ type: "callback", text: "Подобрать по VIN", payload: "vin" }]]
      );
      return;
    }
  } catch (e) {
    console.error("handler error:", e);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server started on port", port));
