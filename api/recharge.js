import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const src = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const { number, amount, operatorcode, circlecode, orderid } = src;

    const username = process.env.A1_USER;
    const pwd = process.env.A1_PWD;
    const proxy = process.env.PROXY_URL;

    if (!number || !operatorcode || !amount) {
      return res.status(200).json({ status: 'Failed', message: 'Missing number / operator / amount' });
    }

    // FIX 1: Circle Code - Odisha = 23, 0 nuhen
    const finalCircle = circlecode || 23;
    // FIX 2: Order ID - Khali Number, PQ nuhen
    const finalOrderId = (orderid || String(Date.now())).replace(/[^0-9]/g, '').slice(-12) || String(Date.now());

    const url = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&circlecode=${finalCircle}&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(finalOrderId)}&format=json`;

    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    const data = await new Promise((resolve, reject) => {
      https.get(url, { agent }, (r) => {
        let t = "";
        r.on('data', (c) => t += c);
        r.on('end', () => resolve(t));
      }).on('error', (e) => reject(e));
    });

    console.log('A1 RAW VIA PROXY:', data.slice(0, 500));

    let parsed;
    try { parsed = JSON.parse(data); } catch(e) {
      const parts = data.split(',');
      parsed = { txid: parts[0], status: parts[1], opid: parts[2], number: parts[3], amount: parts[4], orderid: parts[5] };
    }

    const st = (parsed.status || '').toString().toLowerCase();
    if (st === 'success' || st === 'pending' || st === 'accepted') {
      return res.status(200).json({ status: parsed.status, orderid: parsed.txid || parsed.orderid || finalOrderId, opid: parsed.opid || '', raw: parsed });
    } else {
      return res.status(200).json({ status: 'Failed', message: parsed.status || parsed.message || data.slice(0, 200), raw: parsed });
    }

  } catch (e) {
    console.log('PROXY ERROR:', e.message);
    return res.status(200).json({ status: 'Failed', message: 'A1 Connect Error: ' + e.message });
  }
}
