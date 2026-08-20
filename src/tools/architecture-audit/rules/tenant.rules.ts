export const tenantRules = [
  {
    pattern: "collection(",
    severity: "P1",
    message: "Firestore collection query detected. Verify tenantId filter."
  }
];
