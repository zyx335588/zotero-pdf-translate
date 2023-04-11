import { TranslateTaskProcessor } from "../../utils/translate";

export default <TranslateTaskProcessor>async function (data) {
  const xhr = await Zotero.HTTP.request("GET", `http://dict.cn/${data.raw}`, {
    responseType: "text",
  });
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }

  let res = xhr.response as string;
  // let tgt = "";
  // try {
  //   const audioRegex = /naudio="(\w+.mp3\?t=\w+?)"/;
  //   data.audio =
  //     res.match(new RegExp(audioRegex, "gi"))?.map((s: string) => ({
  //       text: "",
  //       url: "http://audio.dict.cn/" + s.match(new RegExp(audioRegex, "i"))![1],
  //     })) || [];
  //   const symbolsRegex = /<span>(.)[\n\t\s]*?<bdo lang="EN-US">(.+?)<\/bdo>/;
  //   let symbols: string[] = [];
  //   res.match(new RegExp(symbolsRegex, "g"))!.forEach((line) => {
  //     let [_, country, sym] = line.match(symbolsRegex)!;
  //     symbols.push(`${country} ${sym}`);
  //   });
  //   tgt += symbols.join("\n") + "\n";
  //   res = res.match(/<ul class="dict-basic-ul">[\s\S]+?<\/ul>/)![0];
  // } catch (e) {
  //   throw "Parse error";
  // }
  // for (let line of res.match(/<li>[\s\S]+?<\/li>/g) || []) {
  //   tgt +=
  //     line
  //       .replace(/<\/?.+?>/g, "")
  //       .replace(/[\n\t]+/g, " ")
  //       .trim() + "\n";
  // }
  // data.result = tgt;
  const phonetic: string[] = [];
  const result: string[] = [];
  const doc = ztoolkit.getDOMParser().parseFromString(res, "text/html");
  try {
    const description = Array.from(doc.querySelectorAll("ul.dict-basic-ul >li"));
    if (description.length === 0) {
      throw "No result Found";
    }
    description.forEach((e:Element) =>{
      const text = (e as HTMLElement).innerText as string;
      if (text.length > 0 && !text.includes("<!--") ) {
          result.push(text.replace(/\s/g,"").replace(".", ". "))
      }
    })

    const phoneticSpan = Array.from(doc.querySelectorAll("div.phonetic >span"));
    phoneticSpan.forEach((e: Element, i: number) => {
      const symbol = (e as HTMLElement).innerText?.replace(/[\s\t\n]*/g,"");
      if(symbol) {
          phonetic.push(symbol);
      }
      Array.from(e.querySelectorAll("i")).map((i:Element) => {
          data.audio.push(
              {"text": symbol as string,
               "url": "http://audio.dict.cn/" + (i.getAttribute("naudio") as string),
               "tooltiptext": `[${symbol.slice(0,1)}]${(i as HTMLElement).getAttribute("title")?.slice(0,3)}`,
              }
          )
      })
    })

    data.phoneticSymbols = phonetic.join(", ");
    data.result = data.phoneticSymbols + "\n"+ result.join("\n").trim();
  } catch (e) {
    throw "Parse error";
  } 
};
