export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({status:'Failed', message:'Method not allowed'});

  const { number, operatorcode, amount, orderid } = req.body;

  // Old code -> A1 code mapping
  const MAP = { "1":"RC", "2":"A", "3":"V", "4":"BR", "5":"RC", "6":"A" };
  let a1_op = MAP[operatorcode] || operatorcode;

  // A1 API URL
  const url = `https://a1topup.com/api/recharge?username=${process.env.A1_USERNAME}&pwd=${process.env.A1_PASSWORD}&circlecode=2&operatorcode=${a1_op}&number=${number}&amount=${amount}&orderid=${orderid}`;

  try{
    let r = await fetch(url);
    let text = await r.text();
    let data = {};
    try{ data = JSON.parse(text); }catch(e){ data = { raw: text }; }

    // A1 response -> App response
    if(data.status == 1 || data.status == 'Success' || data.status == 'Pending'){
      return res.json({ status: data.status == 1 ? 'Success' : 'Pending', orderid, raw: data });
    } else {
      return res.json({ status: 'Failed', message: data.message || data.msg || text, raw: data });
    }
  }catch(e){
    return res.json({ status:'Failed', message: 'A1 API Error: ' + e.message });
  }
}
