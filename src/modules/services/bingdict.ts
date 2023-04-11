import { TranslateTaskProcessor } from "../../utils/translate";

export default <TranslateTaskProcessor>async function (data) {
  const xhr = await Zotero.HTTP.request(
    "GET",
    `https://cn.bing.com/dict/search?q=${encodeURIComponent(data.raw)}/`,
    { responseType: "text" }
  );
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }

  let res = xhr.response;
  const doc = ztoolkit.getDOMParser().parseFromString(res, "text/html");
  const mp3s = Array.from(doc.querySelectorAll(".hd_area .bigaud"));
  const phoneticText = doc.querySelectorAll(".hd_area .b_primtxt");
  data.audio = mp3s.map((a: Element, i: number) => ({
    text: phoneticText[i].innerHTML.replace("&nbsp;", " "),
    url: (a.getAttribute("onclick")?.match(/https?:\/\/\S+\.mp3/g) || [""])[0],
  }));

  try {
    res = res.match(/<meta name=\"description\" content=\"(.+) \" ?\/>/gm)[0];
  } catch (e) {
    throw "Parse error";
  }
  let tgt = "";
  const description = res.split("，");
  data.phoneticSymbols = description[1] + ", " + description[2];
  for (let line of description.slice(3)) {
    if (line.indexOf("网络释义") > -1) {
      tgt += line.slice(0, line.lastIndexOf("；"));
    } else {
      tgt += line + "\n";
    }
  }
  tgt = tgt.replace(/" \/>/g, "");
  tgt = tgt.replace(/(?:[； ])\s*([a-v]{1,6}\.)/g, "\n$1").trim();
  tgt = tgt.replace(/\s*网络释义：/,"\n网络释义: ").trim();
  tgt = data.phoneticSymbols + "\n" + tgt;
  data.result = tgt;
};
