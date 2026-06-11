import axios from "axios";

const BASE = "https://gw-napi.kotaksecurities.com";

export async function placeOrder(payload) {
  return axios.post(
    `${BASE}/Orders/2.0/quick/order/rule/ms/place`,
    payload,
    {
      headers: {
        "Authorization": `Bearer ${process.env.NEO_ACCESS_TOKEN}`,
        "consumerKey": process.env.NEO_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );
}

export async function margins() {
  return axios.get(`${BASE}/Limits/1.0/limits`, {
    headers: {
      "Authorization": `Bearer ${process.env.NEO_ACCESS_TOKEN}`,
      "consumerKey": process.env.NEO_API_KEY
    }
  });
}