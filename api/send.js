export default async function handler(req, res) {
  // 1. Проверяем метод
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  // 2. Проверяем наличие текста
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  // 3. Берем данные из окружения
  const VK_TOKEN = process.env.VK_BOT_TOKEN;
  const VK_USER_IDS = [
    process.env.VK_USER_ID_1,
    process.env.VK_USER_ID_2,
  ].filter(Boolean); // Убирает пустые элементы, если в .env заполнен только один ID

  // 4. Проверяем, настроены ли переменные окружения
  if (!VK_TOKEN || VK_USER_IDS.length === 0) {
    return res.status(500).json({ 
      error: 'Server configuration error: missing VK_BOT_TOKEN or VK_USER_IDS' 
    });
  }

  try {
    // 5. Формируем параметры для API ВК
    const vkParams = new URLSearchParams({
      access_token: VK_TOKEN,
      user_ids: VK_USER_IDS.join(','), // Собирает ID через запятую, например "12345,67890"
      message: text,
      random_id: Math.floor(Math.random() * 2147483647), // Защита от дублей (обязательно в ВК)
      v: '5.131' // Актуальная версия API
    });

    // 6. Делаем запрос к ВК
    const response = await fetch(`https://api.vk.com/method/messages.send?${vkParams.toString()}`, {
      method: 'POST'
    });

    const data = await response.json();

    // 7. Проверяем, ответил ли ВК ошибкой (например, не разрешены сообщения или плохой токен)
    if (data.error) {
      return res.status(400).json({ 
        success: false, 
        error_code: data.error.error_code,
        error_msg: data.error.error_msg 
      });
    }

    // 8. Если всё успешно, ВК вернет массив с результатами для каждого ID
    return res.status(200).json({ 
      success: true, 
      response: data.response 
    });

  } catch (err) {
    // Сюда код попадет, только если упал сам сервер или пропал интернет
    return res.status(500).json({ error: err.message });
  }
}
