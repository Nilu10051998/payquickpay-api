export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({status:'Failed', message:'Method not allowed'});

  const { number, operatorcode, amount, orderid } = req.body;

  // Tuma Vercel re A1_USER / A1_PWD achhi, seta bi chaliba + A1_USERNAME bi chaliba
  const A1_USER = process.env.A1_USERNAME || process.env.A1_USER;
  const A1_PWD = process.env.A1_PASSWORD || process.env.A1_PWD;

  if(!A1_USER || !A1_PWD){
    return res.json({ status:'Failed', message:'A1_USER / A1_PWD payquickpay-api project re set heini.' });
  }

  const MAP = { "RC":"RC", "RCP":"RC", "A":"A", "AP":"A", "V":"V", "BR":"BR", "BT":"BT", "1":"RC", "2":"A", "3":"V", "4":"BR", "5":"RC", "6":"A" };
  let a1_op = MAP[operatorcode] || operatorcode;
  let finalOrderId = orderid || ('PQ' + Date.now());

  const url = `https://a1topup.com/api/recharge?username=${encodeURIComponent(A1_USER)}&pwd=${encodeURIComponent(A1_PWD)}&circlecode=2&operatorcode=${encodeURIComponent(a1_op)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(finalOrderId)}`;

  try{
    let r = await fetch(url);
    let text = await r.text();
    let data = {};
    try{ data = JSON.parse(text); }catch(e){ data = { raw: text }; }
    let resultText = data.result || data.message || data.msg || text || '';
    if(data.status == 1 || data.status == '1' || data.status == 'Success' || data.status == 'Pending' || resultText.toLowerCase().includes('success')){
      return res.json({ status: 'Success', orderid: finalOrderId, raw: data });
    } else {
      return res.json({ status: 'Failed', message: resultText, raw: data });
    }
  }catch(e){
    return res.json({ status:'Failed', message: 'A1 API Error: ' + e.message });
  }
}
