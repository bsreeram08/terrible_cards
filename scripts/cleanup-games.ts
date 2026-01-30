import { db } from "../src/lib/firebase/config";
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, writeBatch } from "firebase/firestore";

async function cleanupStaleGames() {
  console.log("Starting cleanup job...");
  
  // 1. Delete games older than 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const cutoff = Timestamp.fromDate(yesterday);

  try {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, where("updatedAt", "<", cutoff));
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} stale games to delete.`);

    const batch = writeBatch(db);
    let count = 0;

    for (const gameDoc of snapshot.docs) {
      batch.delete(gameDoc.ref);
      
      // Cleanup subcollections manually if needed, or rely on recursive delete if using Admin SDK
      // Since this is client SDK, we can't easily do recursive delete without listing subcollections
      // For MVP, we just delete the game doc. Subcollections will be orphaned but won't show up.
      // A proper solution requires Cloud Functions.
      
      count++;
      if (count >= 400) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log("Cleanup complete.");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

async function cleanupAnonymousUsers() {
  console.log("Cleaning up stale anonymous users...");
  // Similar logic for users collection where isAnonymous == true and lastLoginAt < 30 days
  // ...
}

await cleanupStaleGames();
process.exit(0);
