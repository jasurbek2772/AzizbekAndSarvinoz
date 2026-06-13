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

  // 3. Берем данные из окружения (строго один ID)
  const TOKEN = process.env.VK_TOKEN;
  const USER_ID = process.env.VK_USER_ID_1; 

  // 4. Проверяем, настроены ли переменные окружения
  if (!TOKEN || !USER_ID) {
    return res.status(500).json({ 
      error: 'Server configuration error: missing VK_BOT_TOKEN or VK_USER_ID' 
    });
  }

  try {
    // 5. Формируем параметры для API ВК (используем точечный user_id)
    const params = new URLSearchParams({
      access_token: TOKEN,
      user_id: USER_ID, // Передаем один ID, без запятых
      message: text,
      random_id: Math.floor(Math.random() * 2147483647), 
      v: '5.131' 
    });

    // 6. Делаем запрос к ВК
    const response = await fetch(`https://api.vk.com/method/messages.send?${params.toString()}`, {
      method: 'POST'
    });

    const data = await response.json();

    // 7. Проверяем, ответил ли ВК ошибкой
    if (data.error) {
      return res.status(400).json({ 
        success: false, 
        error_code: data.error.error_code,
        error_msg: data.error.error_msg 
      });
    }

    // 8. Если всё успешно, возвращаем ответ ВК
    return res.status(200).json({ 
      success: true, 
      result: data.response 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
