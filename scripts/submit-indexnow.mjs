import {readdir, readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

const publicDirectory = fileURLToPath(new URL("../apps/web/public/", import.meta.url));
const keyFiles = (await readdir(publicDirectory)).filter((fileName) => /^[a-f0-9]{32,128}\.txt$/.test(fileName));

if (keyFiles.length !== 1) {
  throw new Error(`Expected one IndexNow key file in apps/web/public, found ${keyFiles.length}.`);
}

const keyFileName = keyFiles[0];
const key = (await readFile(new URL(`../apps/web/public/${keyFileName}`, import.meta.url), "utf8")).trim();

if (keyFileName !== `${key}.txt`) {
  throw new Error("The IndexNow key file name must match its contents.");
}

const siteUrl = new URL(process.env.INDEXNOW_SITE_URL ?? "https://www.classroomlab.online");
const sitemapUrl = new URL("/sitemap.xml", siteUrl);
const sitemapResponse = await fetch(sitemapUrl, {
  headers: {"User-Agent": "ScienceStudio-IndexNow/1.0"},
});

if (!sitemapResponse.ok) {
  throw new Error(`Unable to load ${sitemapUrl}: HTTP ${sitemapResponse.status}.`);
}

const sitemap = await sitemapResponse.text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));

if (urlList.length === 0) {
  throw new Error(`No URLs were found in ${sitemapUrl}.`);
}

for (const url of urlList) {
  if (new URL(url).host !== siteUrl.host) {
    throw new Error(`Sitemap URL does not belong to ${siteUrl.host}: ${url}`);
  }
}

const payload = {
  host: siteUrl.host,
  key,
  keyLocation: new URL(`/${keyFileName}`, siteUrl).toString(),
  urlList,
};

if (process.env.INDEXNOW_DRY_RUN === "1") {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: {"Content-Type": "application/json; charset=utf-8"},
  body: JSON.stringify(payload),
});
const responseText = await response.text();

if (!response.ok) {
  throw new Error(`IndexNow rejected the submission: HTTP ${response.status}${responseText ? ` - ${responseText}` : ""}.`);
}

console.log(`IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`);
