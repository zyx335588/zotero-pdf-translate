import { TranslateTaskProcessor } from "../../utils/translate";

export default <TranslateTaskProcessor>async function (data) {
  const xhr = await Zotero.HTTP.request(
    "GET",
    "https://www.collinsdictionary.com/zh/dictionary/english-chinese/" +
      encodeURIComponent(data.raw),
    { responseType: "text" }
  );

  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }

  if (xhr.responseURL.includes("?q=")) {
    throw "No result found error";
  }

  const doc = ztoolkit
    .getDOMParser()
    .parseFromString(xhr.response, "text/html");
  Array.prototype.forEach.call(doc.querySelectorAll("script"), (e) =>
    e.remove()
  );
  const explainedWord = doc.querySelector("span.orth")?.innerHTML;
  const phoneticElements = Array.from(
    doc.querySelectorAll(".type-")
  ) as HTMLElement[];
  data.audio = phoneticElements.map((e) => ({
    text: e.innerText.trim().includes(" ")
            ? `${e.innerText.trim().replace(", ", "").replace(" ", ".[")}]`
            : `[${e.innerText.trim()}]`,
    url: e.querySelector("a")?.getAttribute("data-src-mp3") || "",
    tooltiptext: explainedWord,
  }));
  // script in innerText
  const explanationText: string = Array.prototype.map
    .call(doc.querySelectorAll(".hom"), (e: HTMLSpanElement) =>
      e.innerText.replace(/&nbsp;/g, " ")
                  .replace(/[0-9]\./g, "\n- $&")
                  .replace(/\[(.*?)\][; ]*/g, (m,a) => {
                    if (a.search(/[^\s\[\],a-zA-Z]/i) !== -1) return "\n   ";
                    return m;
                  })
                  .trim()
    )
    .join("\n")
    .replace(/\([\u4e00-\u9fa5],\s[a-z].*?\)/g,"")
    .replace(/\n\s*\n/g, "\n")
    .replace(/(词\s?(?:\[[^\[\]]\])*)\s?([^\[\s\n-])/g, "$1\n- $2");
    

  const phoneticSymbols: string[] = [];
  data.audio.forEach(v => {
    if (v.text) phoneticSymbols.push(v.text); 
  })
  data.phoneticSymbols = phoneticSymbols.join(", ");

  data.result = (explainedWord === data.raw ? "" : explainedWord + "\n") 
              + data.phoneticSymbols + "\n" 
              + explanationText;
};
