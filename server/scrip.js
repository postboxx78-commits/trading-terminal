import axios from "axios";
import fs from "fs";

export async function downloadScrip(url){

  const r = await axios.get(url);

  fs.writeFileSync("scrip.csv", r.data);
}
