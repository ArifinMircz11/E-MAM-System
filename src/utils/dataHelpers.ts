export const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  return new Error(String(err));
};

export const sanitizeError = (err: unknown): string => {
  return toError(err).message;
};

export const sanitizeForJSON = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

export const dataHelpers = {
  toError,
  sanitizeError,
  sanitizeForJSON,
};

