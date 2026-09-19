import crypto from 'node:crypto';

const KEY_LENGTH = 64;

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${hash}`;
};

export const verifyPassword = (password, stored) => {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt:')) return false;
  const [, salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
};
