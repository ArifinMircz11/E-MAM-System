$file="src/services/dbGateway.ts"

$content=@"
import {
  getFirestore,
  Firestore
} from "firebase/firestore";

import { firebaseApp } from "./firebase";

let instance: Firestore | null = null;

export function getFirestoreGateway(): Firestore {

  if(!instance){
    instance = getFirestore(firebaseApp);
  }

  return instance;
}

export default getFirestoreGateway;
"@

Set-Content $file $content -Encoding UTF8

Write-Host "Firestore Gateway repaired"
