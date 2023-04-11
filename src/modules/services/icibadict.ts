import { TranslateTaskProcessor } from "../../utils/translate";
/**
 * http://open.iciba.com/index.php?c=wiki&t=cc
 * JSON 字段解释(英文)
 * {
 *   'word_name':'' #单词
 *   'exchange': '' #单词的各种时态
 *   'symbols':'' #单词各种信息 下面字段都是这个字段下面的
 *   'ph_en': '' #英式音标
 *   'ph_am': '' #美式音标
 *   'ph_en_mp3':'' #英式发音
 *   'ph_am_mp3': '' #美式发音
 *   'ph_tts_mp3': '' #TTS发音
 *   'parts':'' #词的各种意思
 * }
 */
export default <TranslateTaskProcessor>async function (data) {
  const key = data.secret;  // 0CD3A4C079D2D23C683BBFF96300E924
  const xhr = await Zotero.HTTP.request(
    "GET",
    `http://dict-co.iciba.com/api/dictionary.php?type=json&key=${key}&w=${data.raw}`,
    {
      responseType: "json",
    }
  );
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }

  const res = xhr.response;
  const symbols = res['symbols'][0];
  const parts = symbols['parts'];              
  if(parts === undefined) {
    throw "No result found error";
  }

  const ph_type: {[key: string]: string} = {
    "ph_en": "英",
    "ph_am": "美",
    "ph_other": "TTS ",
  }
  let phonetic: string[] = [];
  Object.keys(ph_type).forEach((type: string) => {
    if (symbols[type]) {
        const text = ph_type[type] + "[" + symbols[type].replace("http://res-tts.iciba.com", "") + "]";
        phonetic.push(text);
        data.audio.push({
          text: text,
          url: symbols[`{type}_mp3`] !== undefined 
              ? symbols[`{type}_mp3`]
              : symbols["ph_tts_mp3"],
        })
      } 
  })
  
  let explanationText = "";
  for (let part of parts) {
    explanationText += `${part['part']} ${part['means'].join("; ")}\n`
  }

  data.phoneticSymbols = phonetic.join(", ");
  data.result = data.phoneticSymbols + "\n" + explanationText.trim();
}
