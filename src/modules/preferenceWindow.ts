import { config } from "../../package.json";
import { getService, colorValueName, LANG_CODE, SERVICES } from "../utils/config";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import {
  validateServiceSecret,
  secretStatusButtonData,
  setServiceSecret,
} from "../utils/translate";

export function registerPrefsWindow() {
  ztoolkit.PreferencePane.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("pref.title"),
    image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
    defaultXUL: true,
  });
}

export function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  addon.data.prefs.window = _window;
  buildPrefsPane();
  updatePrefsPaneDefault();
}

const colorNames = Object.values(colorValueName);
const colorValues = Object.keys(colorValueName);

function buildPrefsPane() {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }
  // menus
  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("sentenceServices"),
      attributes: {
        value: getPref("translateSource") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setSentenceService");
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          children: SERVICES.filter(
            (service) => service.type === "sentence"
          ).map((service) => ({
            tag: "menuitem",
            attributes: {
              label: getString(`service.${service.id}`),
              value: service.id,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("sentenceServices-placeholder")}`)!
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("wordServices"),
      attributes: {
        value: getPref("dictSource") as string,
        native: "true",
      },
      classList: ["use-word-service"],
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setWordService");
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          children: SERVICES.filter((service) => service.type === "word").map(
            (service) => ({
              tag: "menuitem",
              attributes: {
                label: getString(`service.${service.id}`),
                value: service.id,
              },
            })
          ),
        },
      ],
    },
    doc.querySelector(`#${makeId("wordServices-placeholder")}`)!
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("langfrom"),
      attributes: {
        value: getPref("sourceLanguage") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setSourceLanguage");
          },
        },
      ],
      styles: {
        maxWidth: "250px",
      },
      children: [
        {
          tag: "menupopup",
          children: LANG_CODE.map((lang) => ({
            tag: "menuitem",
            attributes: {
              label: lang.name,
              value: lang.code,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("langfrom-placeholder")}`)!
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("langto"),
      attributes: {
        value: getPref("targetLanguage") as string,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            onPrefsEvents("setTargetLanguage");
          },
        },
      ],
      styles: {
        maxWidth: "250px",
      },
      children: [
        {
          tag: "menupopup",
          children: LANG_CODE.map((lang) => ({
            tag: "menuitem",
            attributes: {
              label: lang.name,
              value: lang.code,
            },
          })),
        },
      ],
    },
    doc.querySelector(`#${makeId("langto-placeholder")}`)!
  );

  doc
    .querySelector(`#${makeId("enableAuto")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setAutoTranslateSelection");
    });

  doc
    .querySelector(`#${makeId("enableComment")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setAutoTranslateAnnotation");
    });

  doc
    .querySelector(`#${makeId("enableComment")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setAutoTranslateAnnotation");
    });
  
  
  colorValues.forEach((colorValue) => {
    const colorName = colorValueName[colorValue];
    const elemIdStr = `enable${colorName}Annotation`;
    doc
      .querySelector(`#${makeId(elemIdStr)}`)
      ?.addEventListener("command", (e: Event) => {
        ztoolkit.log("$$$$$$$$$$$$");
        updateTransAnnoColorListFromChkbox(colorValue);
      });  
  });

  doc
    .querySelector(`#${makeId("enableAllAnnotation")}`)
    ?.addEventListener("command", (e: Event) => {
      updateTransAnnoColorListFromChkbox("all");
  });
  
  doc
    .querySelector(`#${makeId("enableOtherAnnotation")}`)
    ?.addEventListener("blur", (e: Event) => {
      updateTransAnnoColorListFromInput();
  });

  doc
    .querySelector(`#${makeId("enablePopup")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setEnablePopup");
    });

  doc
    .querySelector(`#${makeId("enableAddToNote")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setEnableAddToNote");
    });

  doc
    .querySelector(`#${makeId("useWordService")}`)
    ?.addEventListener("command", (e: Event) => {
      onPrefsEvents("setUseWordService");
    });

  doc
    .querySelector(`#${makeId("sentenceServicesSecret")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateSentenceSecret");
    });

  doc
    .querySelector(`#${makeId("wordServicesSecret")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateWordSecret");
    });

  doc
    .querySelector(`#${makeId("fontSize")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updateFontSize");
    });

  doc
    .querySelector(`#${makeId("lineHeight")}`)
    ?.addEventListener("input", (e: Event) => {
      onPrefsEvents("updatelineHeight");
    });
}

function updatePrefsPaneDefault() {
  onPrefsEvents("setAutoTranslateAnnotation", false);
  onPrefsEvents("setEnablePopup", false);
  onPrefsEvents("setUseWordService", false);
  onPrefsEvents("setSentenceSecret", false);
  onPrefsEvents("setWordSecret", false);
  // loadAutoTranslateAnnotationColor();  
}

function updateTransAnnoColorListFromChkbox(colorValue: string) {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  if (colorValue === "all") {
    loadAutoTranslateAnnotationColor();
    return;
  }

  const colorName = colorValueName[colorValue];
  const elemIdStr = `enable${colorName}Annotation`;
  const colorList = (getPref("translateAnnotationColorList") as string)
                  .replace(" ", "")
                  .split(",");
  ztoolkit.log('chk-colorList:');
  ztoolkit.log(colorList);

  let newColorList:string[] = [];
  let checked = ((doc.querySelector(`#${makeId(elemIdStr)}`)) as XUL.Checkbox)
                  ?.checked;
  ztoolkit.log(`chk-checked: ${colorValue}, ${checked}`);

  if (checked) {
    colorList.push(colorValue);
    newColorList = Array.from(new Set(colorList));
    ztoolkit.log(`chk-f1-newColorList:`);
    ztoolkit.log(newColorList);
  } else {
    newColorList = colorList.filter(v => {
      if (v.toLowerCase() !== colorValue) return v;});
    ztoolkit.log(`chk-f2-newColorList:`);
    ztoolkit.log(newColorList);
    newColorList = Array.from(new Set(newColorList));
  }

  ztoolkit.log(`chk-newColorList:`);
  ztoolkit.log(newColorList);

  setPref("translateAnnotationColorList", newColorList.join(",").replace(" ",""));
  loadAutoTranslateAnnotationColor();
}

function updateTransAnnoColorListFromInput() {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  let buildinColorList: string[] = [];
  let inputColorList: string[] = [];
  let newColorList: string[] = [];
  colorValues.forEach((colorValue) => {
    const colorName = colorValueName[colorValue];
    const elemIdStr = `enable${colorName}Annotation`;
    let checked = ((doc.querySelector(`#${makeId(elemIdStr)}`)) as XUL.Checkbox)
                  .checked;
    if (checked) {
      buildinColorList.push(colorValue);
    }
  });

  const inputColorString = (doc.querySelector(
      `#${makeId("enableOtherAnnotation")}`
      ) as HTMLInputElement
    ).value
  if (inputColorString.length > 0) {
    inputColorList = inputColorString.toLowerCase()
                      .replace(" ", "")
                      .replace("，",",")
                      .split(",");
  }

  newColorList = buildinColorList.concat(inputColorList);
  newColorList = Array.from(new Set(newColorList));

  setPref("translateAnnotationColorList", newColorList.join(","));
  loadAutoTranslateAnnotationColor();
}

function loadAutoTranslateAnnotationColor() {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  // 获取设置文件中的 颜色列表 ;并在设置中显示对应的选项
  const colorListString = getPref("translateAnnotationColorList") as string;
  const checkedAllAnnotation = getPref("enableAllAnnotation") as boolean;
  const checkedEnableComment = getPref("enableComment") as boolean;
  const disabled = (!checkedEnableComment || checkedAllAnnotation) as boolean
  const colorList = colorListString.replace(" ","").split(",");
  const inputOtherAnnotationBox 
          = doc.querySelector(`#${makeId("enableOtherAnnotation")}`) as HTMLInputElement;
  const inputOtherAnnotationLabel 
          = doc.querySelector(`#${makeId("enableOtherAnnotationLabel")}`) as XUL.Label;
  const enableAllAnnotationChkbox
          = doc.querySelector(`#${makeId("enableAllAnnotation")}`) as XUL.Checkbox
  
  const inputOtherAnnotationBoxValue = colorList.filter((colorValue) =>{
      if(!colorValues.includes(colorValue)) return colorValue;
    }).join(",")
      .replace(" ","")
      .replace("，", ",");

  ztoolkit.log(`colorListSting: ${colorListString}`);
  ztoolkit.log(`checkedAllAnnotation: ${checkedAllAnnotation}`);
  ztoolkit.log(`checkedEnableComment: ${checkedEnableComment}`);
  ztoolkit.log(`disabled: ${disabled}`);
  ztoolkit.log(`colorList:`);
  ztoolkit.log(colorList);
  ztoolkit.log(`colorValues:`);
  ztoolkit.log(colorValues);
  ztoolkit.log(`inputOtherAnnotationBoxValue: ${inputOtherAnnotationBoxValue}`);

  inputOtherAnnotationBox.setAttribute("value",inputOtherAnnotationBoxValue);
  
  enableAllAnnotationChkbox.checked = checkedAllAnnotation;
  enableAllAnnotationChkbox.disabled = !checkedEnableComment;
  inputOtherAnnotationBox.readOnly = disabled;
  inputOtherAnnotationLabel.disabled = disabled;

  colorValues.forEach ((colorValue) => {
    const colorName = colorValueName[colorValue];
    const elemIdStr = `enable${colorName}Annotation`;
    const checked: boolean = colorList?.includes(colorValue);
    ((doc.querySelector(`#${makeId(elemIdStr)}`)) as XUL.Checkbox)
        .checked = checked;
    ((doc.querySelector(`#${makeId(elemIdStr)}`)) as XUL.Checkbox)
        .disabled = disabled;
  });
  
}


function onPrefsEvents(type: string, fromElement: boolean = true) {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }

  const setDisabled = (className: string, disabled: boolean) => {
    doc
      .querySelectorAll(`.${className}`)
      .forEach(
        (elem) => ((elem as XUL.Element & XUL.IDisabled).disabled = disabled)
      );
  };
  switch (type) {
    case "setAutoTranslateSelection":
      addon.hooks.onReaderTabPanelRefresh();
      break;
    case "setAutoTranslateAnnotation":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enableComment")}`) as XUL.Checkbox)
              .checked
          : (getPref("enableComment") as boolean);
        const hidden = !elemValue;
        setDisabled("auto-annotation", hidden);
        loadAutoTranslateAnnotationColor();
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "setEnablePopup":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enablePopup")}`) as XUL.Checkbox)
              .checked
          : (getPref("enablePopup") as boolean);
        const hidden = !elemValue;
        setDisabled("enable-popup", hidden);
        if (!hidden) {
          onPrefsEvents("setEnableAddToNote", fromElement);
        }
      }
      break;
    case "setEnableAddToNote":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("enableAddToNote")}`) as XUL.Checkbox)
              .checked
          : (getPref("enableNote") as boolean);
        const hidden = !elemValue;
        setDisabled("enable-popup-addtonote", hidden);
      }
      break;
    case "setUseWordService":
      {
        let elemValue = fromElement
          ? (doc.querySelector(`#${makeId("useWordService")}`) as XUL.Checkbox)
              .checked
          : (getPref("enableDict") as boolean);
        const hidden = !elemValue;
        setDisabled("use-word-service", hidden);
      }
      break;
    case "setSentenceService":
      {
        setPref(
          "translateSource",
          (
            doc.querySelector(`#${makeId("sentenceServices")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        onPrefsEvents("setSentenceSecret", fromElement);
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "updateSentenceSecret":
      {
        setServiceSecret(
          getPref("translateSource") as string,
          (
            doc.querySelector(
              `#${makeId("sentenceServicesSecret")}`
            ) as HTMLInputElement
          ).value
        );
      }
      break;
    case "setSentenceSecret":
      {
        const serviceId = getPref("translateSource") as string;
        const secretCheckResult = validateServiceSecret(
          serviceId,
          (validateResult) => {
            if (fromElement && !validateResult.status) {
              addon.data.prefs.window?.alert(
                `You see this because the translation service ${serviceId} requires SECRET, which is NOT correctly set.\n\nDetails:\n${validateResult.info}`
              );
            }
          }
        );
        (
          doc.querySelector(
            `#${makeId("sentenceServicesSecret")}`
          ) as HTMLInputElement
        ).value = secretCheckResult.secret;
        // Update secret status button
        const statusButtonData = secretStatusButtonData[serviceId];
        const statusButton = doc.querySelector(
          `#${makeId("sentenceServicesStatus")}`
        ) as XUL.Button;
        if (statusButtonData) {
          statusButton.hidden = false;
          statusButton.label = getString(
            statusButtonData.labels[secretCheckResult.status ? "pass" : "fail"]
          );
          statusButton.onclick = (ev) => {
            statusButtonData.callback(secretCheckResult.status);
          };
        } else {
          statusButton.hidden = true;
        }
      }
      break;
    case "setWordService":
      {
        setPref(
          "dictSource",
          (
            doc.querySelector(`#${makeId("wordServices")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        onPrefsEvents("setWordSecret", fromElement);
      }
      break;
    case "updateWordSecret":
      {
        setServiceSecret(
          getPref("dictSource") as string,
          (
            doc.querySelector(
              `#${makeId("wordServicesSecret")}`
            ) as HTMLInputElement
          ).value
        );
      }
      break;
    case "setWordSecret":
      {
        const serviceId = getPref("dictSource") as string;
        const secretCheckResult = validateServiceSecret(
          serviceId,
          (validateResult) => {
            if (fromElement && !validateResult.status) {
              addon.data.prefs.window?.alert(
                `You see this because the translation service ${serviceId} requires SECRET, which is NOT correctly set.\n\nDetails:\n${validateResult.info}`
              );
            }
          }
        );
        (
          doc.querySelector(
            `#${makeId("wordServicesSecret")}`
          ) as HTMLInputElement
        ).value = secretCheckResult.secret;
      }
      break;
    case "setSourceLanguage":
      {
        setPref(
          "sourceLanguage",
          (
            doc.querySelector(`#${makeId("langfrom")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "setTargetLanguage":
      {
        setPref(
          "targetLanguage",
          (
            doc.querySelector(`#${makeId("langto")}`) as XUL.MenuList
          ).getAttribute("value")!
        );
        addon.hooks.onReaderTabPanelRefresh();
      }
      break;
    case "updateFontSize":
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
      break;
    case "updatelineHeight":
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
      break;
    default:
      return;
  }
}

function makeId(type: string) {
  return `${config.addonRef}-${type}`;
}
