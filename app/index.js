import { get } from "axios";
import { load } from "cheerio";
import { Link, Content, Image, closeMongo } from "./mongo";

let resultJson = {};

// Fetches html body from given endpoint
const getHtmlFromUrl = async (url) => {
  try {
    const { data } = await get(url);
    return data;
  } catch (error) {
    console.error("Error while getting html from url -> ", error);
  }
};

const extractData = (tag, $, url) => {
  if (tag === "img") {
    resultJson[url]["images"] = [];
    $(tag).each((i, v) => {
      const { attribs: { src } = {} } = v || {};
      if (src) resultJson[url]["images"].push(src);
    });
  } else if (tag === "a") {
    resultJson[url]["links"] = [];
    $(tag).each((i, v) => {
      const { attribs: { href } = {} } = v || {};
      if (href) {
        if (!href.includes(".com")) {
          resultJson[url]["links"].push(`${url}${href}`);
        } else resultJson[url]["links"].push(href);
      }
    });
  } else {
    resultJson[url]["contents"] = [];
    $(tag).each((i, v) => {
      const { attribs: { title } = {} } = v || {};
      if (title) resultJson[url]["contents"].push(title);
    });
  }
};

const grabContent = async (url) => {
  const html = await getHtmlFromUrl(url);
  resultJson = { [url]: {} };
  const $ = load(html);
  ["img", "a", "*"].map((x) => extractData(x, $, url));
  for (let i in resultJson) {
    const v = resultJson[i];
    for (let k in v) {
      if (k === "images") {
        const exists = await Image.findOne({ website: url });
        if (exists) {
          await Image.updateOne({ website: url }, { data: v[k] });
        } else {
          const record = new Image({ website: url, data: v[k] });
          await record.save();
        }
      } else if (k === "links") {
        const exists = await Link.findOne({ website: url });
        if (exists) {
          await Link.updateOne({ website: url }, { data: v[k] });
        } else {
          const record = new Link({ website: url, data: v[k] });
          await record.save();
        }
      } else {
        const exists = await Content.findOne({ website: url });
        if (exists) {
          await Content.updateOne({ website: url }, { data: v[k].join(", ") });
        } else {
          const record = new Content({ website: url, data: v[k].join(", ") });
          await record.save();
        }
      }
    }
  }
};
const init = async () => {
  const url = "https://timesofindia.indiatimes.com";
  const inputData = [
    `${url}`,
    `${url}/news`,
    `${url}/sports`,
    `${url}/business`,
  ];
  let k = inputData.length;
  while (k--) {
    await grabContent(inputData[k]);
  }
};

init().then((x) => closeMongo());
