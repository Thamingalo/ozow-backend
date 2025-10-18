import crypto from "crypto";

export function generateHash(fields) {
  const { SiteCode, CountryCode, CurrencyCode, Amount, TransactionReference, BankReference, CancelUrl, ErrorUrl, SuccessUrl, NotifyUrl, IsTest } = fields;
  const toHash = `${SiteCode}${CountryCode}${CurrencyCode}${Amount}${TransactionReference}${BankReference}${CancelUrl}${ErrorUrl}${SuccessUrl}${NotifyUrl}${IsTest}${process.env.OZOW_PRIVATE_KEY}`;
  return crypto.createHash("sha512").update(toHash, "utf8").digest("hex");
}

export function verifyHash(data) {
  const receivedHash = data.Hash;
  const expectedHash = generateHash(data);
  return receivedHash === expectedHash;
}
