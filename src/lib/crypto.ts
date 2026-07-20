import crypto from "crypto";


const algorithm = "aes-256-cbc";


const secretKey =
  process.env.ENCRYPTION_KEY ||
  "change-this-key-32-characters-long";


function getKey(){

  return crypto
    .createHash("sha256")
    .update(secretKey)
    .digest();

}



// ===============================
// CRIPTOGRAFAR
// ===============================

export function encrypt(
  value:string
){

  const iv =
    crypto.randomBytes(16);


  const cipher =
    crypto.createCipheriv(
      algorithm,
      getKey(),
      iv
    );


  let encrypted =
    cipher.update(
      value,
      "utf8",
      "hex"
    );


  encrypted +=
    cipher.final("hex");


  return (
    iv.toString("hex")
    +
    ":"
    +
    encrypted
  );

}



// ===============================
// DESCRIPTOGRAFAR
// ===============================

export function decrypt(
  value:string
){

  const parts =
    value.split(":");


  if(parts.length !== 2){

    throw new Error(
      "Valor criptografado inválido"
    );

  }


  const iv =
    Buffer.from(
      parts[0],
      "hex"
    );


  const encrypted =
    parts[1];


  const decipher =
    crypto.createDecipheriv(
      algorithm,
      getKey(),
      iv
    );


  let decrypted =
    decipher.update(
      encrypted,
      "hex",
      "utf8"
    );


  decrypted +=
    decipher.final(
      "utf8"
    );


  return decrypted;

}
