export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  try{
    const r=await fetch('https://business.a1topup.com/recharge/balance?username=505942&pwd=605254&format=json');
    const t=await r.text();
    res.status(200).json({balance:t.trim()});
  }catch(e){ res.status(500).json({error:'Failed'}); }
}
