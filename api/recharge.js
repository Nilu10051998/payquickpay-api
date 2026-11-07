import { ProxyAgent } from 'undici';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'Failed', message: 'Method not allowed' });

  const { number, operatorcode, amount, orderid } = req.body || {};
  const A1_USER = process.env.A1_USER;
  const A1_PWD = process.env.A1_PWD;
  const PROXY_URL = process.env.PROXY_URL;

  if (!number || !operatorcode || !amount) {
    return res.status(200).json({ status: 'Failed', message: 'Missing number / operator / amount' });
  }

  const url = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(A1_USER)}&pwd=${encodeURIComponent(A1_PWD)}&circlecode=0&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(orderid || 'PQ' + Date.now())}&format=json`;

  // 1. PROXY re try kara
  try {
    const proxy = new ProxyAgent(PROXY_URL);
    const r = await fetch(url, { dispatcher: proxy });
    const text = await r.text();
    console.log('A1 VIA PROXY:', text.slice(0, 500));
    return res.status(200).json({ status: 'Proxy OK', raw: text.slice(0, 500) });
  } catch (e) {
    console.log('PROXY FAILED:', e.message, e.cause?.message);
  }

  // 2. Jodi Proxy fail hela, Direct try kara - A1 kana kahe dekhiba
  try {
    const r2 = await fetch(url);
    const text2 = await r2.text();
    console.log('A1 DIRECT:', text2.slice(0, 500));
    return res.status(200).json({ status: 'Failed', message: 'Proxy Failed, Direct Response: ' + text2.slice(0, 300) });
  } catch (e2) {
    return res.status(200).json({ status: 'Failed', message: 'Proxy Failed: ' + e2.message + ' | Direct Failed: ' + e2.message });
  }
}
