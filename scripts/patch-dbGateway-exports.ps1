$file="src\services\dbGateway.ts"

$content=Get-Content $file -Raw

$content=$content -replace `
"export const onSnapshot = firestoreAdapter.onSnapshot;",
@"
export const onSnapshot = firestoreAdapter.onSnapshot;

export const getDoc = firestoreAdapter.getDoc;
export const getDocs = firestoreAdapter.getDocs;

export const setDoc = firestoreAdapter.setDoc;
export const updateDoc = firestoreAdapter.updateDoc;
export const deleteDoc = firestoreAdapter.deleteDoc;

export const writeBatch = firestoreAdapter.writeBatch;

export const arrayUnion = firestoreAdapter.arrayUnion;
export const serverTimestamp = firestoreAdapter.serverTimestamp;
export const increment = firestoreAdapter.increment;
"@

Set-Content $file $content -Encoding UTF8

Write-Host "dbGateway compatibility exports added"
