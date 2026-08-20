import { getAdminDb, getAdminAuth } from "../src/lib/firebase-admin.ts";

async function testFirebase() {

  console.log("================================");
  console.log("e-MAM Firebase Admin Health Check");
  console.log("================================");

  try {

    const db = getAdminDb();

    console.log("Firestore Instance : OK");

    const test = await db.collection("_health_check")
      .limit(1)
      .get();

    console.log(
      "Firestore Read     : OK",
      "Documents:",
      test.size
    );

  } catch(error:any) {

    console.error(
      "Firestore FAILED:",
      error.message
    );

  }


  try {

    const auth = getAdminAuth();

    const result = await auth.listUsers(1);

    console.log(
      "Auth Instance      : OK",
      "Users:",
      result.users.length
    );

  } catch(error:any) {

    console.error(
      "Auth FAILED:",
      error.message
    );

  }


}

testFirebase();

