export const validateSchema = (data: any, requiredFields: string[]): boolean => {
  if (!data) return false;
  return requiredFields.every(f => data[f] !== undefined && data[f] !== null);
};
