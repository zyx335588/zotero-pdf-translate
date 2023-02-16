async function icibadict(text: string = undefined) {
    // http://open.iciba.com/index.php?c=wiki&t=cc
    let args = this.getArgs("icibadict", text);
    const key = args.secret;  // 0CD3A4C079D2D23C683BBFF96300E924
    return await this.requestTranslate(
        async () => {
            return await Zotero.HTTP.request(
                "GET",
                `https://dict-co.iciba.com/api/dictionary.php?&type=json&w=${encodeURIComponent(args.text.toLowerCase())}&key=${key}`,
                { responseType: "json" }
            );
        },
        (xhr) => {
            const res = xhr.response;      

            const symbols = res['symbols'][0];
            const parts = symbols['parts'];              
            if(parts === undefined) return "[Not Found]"

            let phoneticText = '';
            const phoneticArray = [];
            if (symbols['ph_en']) {
                phoneticArray.push(`UK [${symbols['ph_en']}]`);
            }
            if (symbols['ph_am']) {
                phoneticArray.push(`US [${symbols['ph_am']}]`);
            }
            phoneticText = phoneticArray.join("; ");
            if (!phoneticText && symbols['ph_other']) {
                phoneticText = symbols['ph_other'].split("ˈ")[1];
            }

            let explanationText = '';
            for (let part of parts) {
                explanationText += `${part['part']} ${part['means'].join("; ")}\n`
            }

            // For English:
            // 0: UK; 1: US; 2: TTS
            this._Addon._audioSourceURLs = [symbols['ph_en_mp3'], symbols['ph_en_mp3'], symbols['ph_tts_mp3']];

            const result = `${phoneticText}\n${explanationText}`; // insert phonetic symbol to result
            Zotero.debug("PDFTranslate: \n" + result);

            if (!text) Zotero.ZoteroPDFTranslate._translatedText = result;

            return result;
        }
    );
}

export { icibadict };