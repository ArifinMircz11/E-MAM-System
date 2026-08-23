import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';

export async function deleteFirestoreField(
  collectionPath: string,
  documentId: string,
  fieldPath: string,
) {
  try {
    const docRef = dbGateway.doc(collectionPath, documentId);
    await dbGateway.updateDoc(docRef, {
      [fieldPath]: dbGateway.deleteField(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
}
