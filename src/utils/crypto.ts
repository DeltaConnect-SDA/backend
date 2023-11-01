import {
  createCipheriv,
  randomBytes,
  createDecipheriv,
  createHash,
} from 'crypto';

const alg = 'aes-256-ctr';
let key = process.env.ENCRYPTION_KEY;
key = createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

export const encryptData = (data) => {
  const iv = randomBytes(16);

  const cipher = createCipheriv(alg, key, iv);
  const result = Buffer.concat([iv, cipher.update(data), cipher.final()]);
  return result;
};

export const decryptData = (data) => {
  const iv = data.slice(0, 16);
  data = data.slice(16);

  const decipher = createDecipheriv(alg, key, iv);
  const result = Buffer.concat([decipher.update(data), decipher.final()]);
  return result;
};
