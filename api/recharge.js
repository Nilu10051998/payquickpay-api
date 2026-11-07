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

  if (!A1_USER || !A1_PWD) {
    return res.status(200).json({ status: 'Failed', message: 'A1_USER / A1_PWD payquickpay-api project re set heini.' });
  }

  if (!PROXY_URL) {
    return res.status(200).json({ status: 'Failed', message: 'PROXY_URL set heini payquickpay-api re' });
  }

  if (!number || !operatorcode || !amount) {
    return res.status(200).json({ status: 'Failed', message: 'Missing number / operator / amount' });
  }

  try {
    // *** PROXY - Ebe request tuma 109... IP ru jiba ***
    const proxy = new ProxyAgent(PROXY_URL);

    // *** THIK URL - business.a1topup.com ***
    const url = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(A1_USER)}&pwd=${encodeURIComponent(A1_PWD)}&circlecode=0&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(orderid || 'PQ' + Date.now())}&format=json`;

    const r = await fetch(url, { dispatcher: proxy });
    const text = await r.text();
    console.log('A1 RAW:', text.slice(0, 500));

    // Jodi A1 HTML deithiba (404), tahele bhul
    if (text.trim().startsWith('<')) {
      return res.status(200).json({ status: 'Failed', message: 'A1 API 404 - URL / Account check kara. Raw: ' + text.slice(0, 100) });
    }

    let data;
    try { data = JSON.parse(text); } catch(e) {
      // CSV format asile: txid,status,opid,number,amount,orderid
      const parts = text.split(',');
      data = { txid: parts[0], status: parts[1], opid: parts[2], number: parts[3], amount: parts[4], orderid: parts[5] };
    }

    const st = (data.status || '').toString().toLowerCase();
    if (st === 'success' || st === 'pending' || st === 'accepted') {
      return res.status(200).json({ status: data.status, orderid: data.txid || data.orderid || orderid, opid: data.opid || '', raw: data });
    } else {
      return res.status(200).json({ status: 'Failed', message: data.status || data.message || text.slice(0, 200), raw: data });
    }
  } catch (e) {
    return res.status(200).json({ status: 'Failed', message: 'A1 Connect Error: ' + e.message });
  }
}
