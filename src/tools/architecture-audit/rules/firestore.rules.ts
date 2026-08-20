export const firestoreRules = [
  {
    id: "direct-firestore-import",
    pattern: "firebase/firestore",
    severity: "P0",
    message: "Direct Firebase SDK import detected. Use FirestoreGateway."
  },
  {
    id: "direct-onsnapshot",
    pattern: "onSnapshot",
    severity: "P0",
    message: "Listener must use ListenerManager."
  },
  {
    id: "direct-getdocs",
    pattern: "getDocs",
    severity: "P1",
    message: "Query should pass through Gateway/Repository."
  }
];
