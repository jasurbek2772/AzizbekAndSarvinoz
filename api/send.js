export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  const TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_IDS = [
    process.env.TG_CHAT_ID_1,
    process.env.TG_CHAT_ID_2,
  ];

  try {
    const results = await Promise.all(
      CHAT_IDS.map((chat_id) =>
        fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
        }).then((r) => r.json())
      )
    );

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}