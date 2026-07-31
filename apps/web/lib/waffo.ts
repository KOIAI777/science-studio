import {readFileSync} from "node:fs";
import {WaffoPancake} from "@waffo/pancake-ts";

export const MIDDLE_SCHOOL_PACK_SKU = "middle-school-physics-foundations" as const;
export const MIDDLE_SCHOOL_PACK_PRODUCT_ID = process.env.WAFFO_MIDDLE_SCHOOL_PACK_PRODUCT_ID?.trim() || "PROD_7lFAhhW7zrnoteIovntKOU";
export const MIDDLE_SCHOOL_PACK_PRICE_USD = "9.90";

function getPrivateKey() {
  const directKey = process.env.WAFFO_PRIVATE_KEY?.trim();
  if (directKey) return directKey.replace(/\\n/g, "\n");

  const base64Key = process.env.WAFFO_PRIVATE_KEY_BASE64?.trim();
  if (base64Key) return Buffer.from(base64Key, "base64").toString("utf8");

  const filePath = process.env.WAFFO_PRIVATE_KEY_FILE?.trim();
  if (filePath) return readFileSync(filePath, "utf8").trim();

  throw new Error("Waffo private key is not configured.");
}

export function getWaffoEnvironment(): "test" | "prod" {
  const environment = process.env.WAFFO_ENVIRONMENT ?? "test";
  if (environment !== "test" && environment !== "prod") {
    throw new Error("WAFFO_ENVIRONMENT must be test or prod.");
  }
  return environment;
}

export function getWaffoClient() {
  const merchantId = process.env.WAFFO_MERCHANT_ID?.trim();
  if (!merchantId) throw new Error("Waffo merchant ID is not configured.");

  return new WaffoPancake({merchantId, privateKey: getPrivateKey()});
}

export function getWaffoStoreId() {
  const storeId = process.env.WAFFO_STORE_ID?.trim();
  if (!storeId) throw new Error("Waffo store ID is not configured.");
  return storeId;
}
