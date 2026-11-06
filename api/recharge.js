export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS') return res.status(200).end();
  const {number,amount,operatorcode,circlecode,orderid}=req.query;
  const url=`https://business.a1topup.com/recharge/api?username=505942&pwd=605254&circlecode=${circlecode||23}&operatorcode=${operatorcode}&number=${number}&amount=${amount}&orderid=${orderid}&format=json`;
  try{ const r=await fetch(url); const t=await r.text(); res.status(200).json({result:t}); }
  catch(e){ res.status(500).json({error:'Failed'}); }
}
