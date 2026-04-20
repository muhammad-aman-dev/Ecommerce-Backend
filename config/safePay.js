import Safepay from "@sfpy/node-core"; 

const safepayClient = Safepay(process.env.SAFEPAY_API_KEY,{
  authType: "secret",
  host: "https://sandbox.api.getsafepay.com",
})


export default safepayClient;