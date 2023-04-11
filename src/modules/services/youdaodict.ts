import { stringify } from "querystring";
import { TranslateTaskProcessor } from "../../utils/translate";

export default <TranslateTaskProcessor>async function (data) {
  const xhr = await Zotero.HTTP.request(
    "GET",
    `https://www.youdao.com/w/${encodeURIComponent(data.raw)}/`,
    { responseType: "text" }
  );
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }

  let res = xhr.response;
  res = res.replace(/(\r\n|\n|\r)/gm, "");
  res = res.match(
    /<div id="phrsListTab.*webTrans" class="trans-wrapper trans-tab">/gm
  );

  let tgt = "";
  if (res.length > 0) {
    tgt = res[0].replace(/<[^>]*>?/gm, "\n");
    tgt = tgt.replace(/\n\s*\n/g, "\n");
    tgt = tgt.replace(/\s\s+/g, " ");
    tgt = tgt.replace(data.raw.trim(), "");
    tgt = tgt.replace(/\s*(英.*?)\n(美)/m, (matched, a, b) => {
        if (!a.length) return b;
        return a + ", " + b;
    })
    tgt = tgt.trim();
  }

  data.audio=[];
  data.phoneticSymbols = tgt.split("\n")[0];
  const phonetic = data.phoneticSymbols.split(", ");
  const type: {[key: string]: string} = {
    "英": "1",
    "美": "2"
  };

  phonetic.forEach((p) => {
    data.audio.push({
        text: p.match(/[英美]/) ? p : "",
        url: `https://dict.youdao.com/dictvoice?audio=${data.raw}` + `${p.match(/[英美]/) ? "&type=" + type[p.slice(0,1)] : ""}`
    })
})

  data.result = tgt;
};
