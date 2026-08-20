export const listenerRules = [
  {
    pattern: "onSnapshot",
    message: "Firestore listener outside boundary",
    severity: "P0"
  },
  {
    pattern: "subscribe",
    message: "Check listener cleanup",
    severity: "P1"
  }
];
