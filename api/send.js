export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  // Данные для Telegram
  const TG_TOKEN = process.env.TG_BOT_TOKEN;
  const TG_CHAT_IDS = [
    process.env.TG_CHAT_ID_1,
    process.env.TG_CHAT_ID_2,
  ].filter(Boolean); // Фильтруем пустые значения, если какого-то ID нет в .env

  // Данные для ВК (теперь массив)
  const VK_TOKEN = process.env.VK_BOT_TOKEN;
  const VK_USER_IDS = [
    process.env.VK_USER_ID_1,
    process.env.VK_USER_ID_2,
  ].filter(Boolean);

  try {
    const promises = [];

    // 1. Очередь отправки в Telegram
    if (TG_TOKEN && TG_CHAT_IDS.length > 0) {
      TG_CHAT_IDS.forEach((chat_id) => {
        const tgPromise = fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
        }).then((r) => r.json().then(data => ({ platform: 'telegram', chat_id, data })));
        
        promises.push(tgPromise);
      });
    }

    // 2. Очередь отправки в ВК (оптимизированная, одним запросом на все ID)
    if (VK_TOKEN && VK_USER_IDS.length > 0) {
      const vkParams = new URLSearchParams({
        access_token: VK_TOKEN,
        // Соединяем массив ID в строку через запятую (например: "12345,67890")
        user_ids: VK_USER_IDS.join(','), 
        message: text,
        random_id: Math.floor(Math.random() * 2147483647),
        v: '5.131'
      });

      const vkPromise = fetch(`https://api.vk.com/method/messages.send?${vkParams.toString()}`, {
        method: 'POST'
      }).then((r) => r.json().then(data => ({ platform: 'vk', data })));

      promises.push(vkPromise);
    }

    // Если ни одна платформа не настроена
    if (promises.length === 0) {
      return res.status(500).json({ error: 'Server configuration error: no platforms configured' });
    }

    const results = await Promise.all(promises);

    return res.status(200).json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
