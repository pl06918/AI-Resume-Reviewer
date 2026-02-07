import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function saveReview(uid, payload) {
  const ref = collection(db, "users", uid, "reviews");
  await addDoc(ref, {
    ...payload,
    createdAt: serverTimestamp()
  });
}

export async function listReviews(uid) {
  const ref = collection(db, "users", uid, "reviews");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}
