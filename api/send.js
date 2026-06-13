export default async function handler(req, res) {
  // 1. Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  // 2. Проверяем наличие текста
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  // 3. Данные для Telegram
  const TG_TOKEN = process.env.TG_BOT_TOKEN;
  const TG_CHAT_IDS = [
    process.env.TG_CHAT_ID_1,
    process.env.TG_CHAT_ID_2,
  ].filter(Boolean); // Убирает пустые строки, если какого-то ID нет в .env

  // 4. Данные для ВК
  const VK_TOKEN = process.env.VK_BOT_TOKEN;
  const VK_USER_IDS = [
    process.env.VK_USER_ID_1,
    process.env.VK_USER_ID_2,
  ].filter(Boolean);

  try {
    const promises = [];

    // Очередь отправки в Telegram
    if (TG_TOKEN && TG_CHAT_IDS.length > 0) {
      TG_CHAT_IDS.forEach((chat_id) => {
        const tgPromise = fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
        })
        .then((r) => r.json())
        .then((data) => ({ 
          platform: 'telegram', 
          id: chat_id, 
          success: data.ok, 
          data 
        }));
        
        promises.push(tgPromise);
      });
    }

    // Очередь отправки в ВК (каждому индивидуально вашим рабочим способом)
    if (VK_TOKEN && VK_USER_IDS.length > 0) {
      VK_USER_IDS.forEach((user_id) => {
        const params = new URLSearchParams({
          access_token: VK_TOKEN,
          user_id: user_id, 
          message: text,
          random_id: Math.floor(Math.random() * 2147483647),
          v: '5.131'
        });

        const vkPromise = fetch(`https://api.vk.com/method/messages.send?${params.toString()}`, {
          method: 'POST'
        })
        .then((r) => r.json())
        .then((data) => ({ 
          platform: 'vk', 
          id: user_id, 
          success: !data.error, 
          data: data.error ? data.error.error_msg : data.response 
        }));

        promises.push(vkPromise);
      });
    }

    // Если в .env вообще ничего не настроено
    if (promises.length === 0) {
      return res.status(500).json({ error: 'Server configuration error: no platforms configured' });
    }

    // Запускаем абсолютно все запросы в TG и ВК одновременно
    const results = await Promise.all(promises);

    // Возвращаем красивый структурированный отчет
    return res.status(200).json({ success: true, results });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
