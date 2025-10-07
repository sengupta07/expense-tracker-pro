import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  orderBy,
  Timestamp,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type FirestoreDataConverter,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

// --- Type Definitions ---

export type UserProfile = {
  salary: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Category = {
  id: string;
  name: string;
  monthlyBudget: number;
};

export type Item = {
  id: string;
  name: string;
  cost: number;
  categoryName: string;
  categoryId: string;
  type: "usual" | "luxury";
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  amountSaved: number;
};

export type Expense = {
  id: string;
  date: string; // Stored as ISO string
  itemId: string;
  categoryName: string;
  unitCost: number;
  quantity: number;
};

export type NewExpenseInput = {
  dateISO: string;
  itemId: string;
  categoryName: string;
  unitCost: number;
  quantity: number;
};

// --- Generic Converter ---

const createConverter = <
  T extends { id: string }
>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    const { id, ...rest } = data; // Remove id before writing
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): T => {
    return { id: snapshot.id, ...snapshot.data() } as T;
  },
});

const categoryConverter = createConverter<Category>();
const itemConverter = createConverter<Item>();
const goalConverter = createConverter<Goal>();
const expenseConverter = createConverter<Expense>();

// --- User Functions ---

export async function fetchUser(uid: string): Promise<UserProfile | null> {
  const userRef = doc(getFirestoreDb(), "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
}

export async function updateUser(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(getFirestoreDb(), "users", uid);
  await setDoc(
    userRef,
    { ...data, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

// --- Category Functions ---

export async function fetchCategories(uid: string): Promise<Category[]> {
  const categoriesRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "categories"
  ).withConverter(categoryConverter);
  const snap = await getDocs(categoriesRef);
  return snap.docs.map((d) => d.data());
}

export async function createCategory(uid: string, data: Omit<Category, "id">) {
  const categoriesRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "categories"
  ).withConverter(categoryConverter);
  const newDocRef = doc(categoriesRef);
  await setDoc(newDocRef, { ...data, id: newDocRef.id });
  return newDocRef.id;
}

export async function updateCategory(
  uid: string,
  id: string,
  data: Partial<Omit<Category, "id">>
) {
  const categoryRef = doc(getFirestoreDb(), "users", uid, "categories", id);
  await updateDoc(categoryRef, data);
}

export async function deleteCategory(uid: string, id: string) {
  const categoryRef = doc(getFirestoreDb(), "users", uid, "categories", id);
  await deleteDoc(categoryRef);
}

// --- Item Functions ---

export async function fetchItems(uid: string): Promise<Item[]> {
  const itemsRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "items"
  ).withConverter(itemConverter);
  const snap = await getDocs(itemsRef);
  return snap.docs.map((d) => d.data());
}

export async function createItem(uid: string, data: Omit<Item, "id">) {
  const itemsRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "items"
  ).withConverter(itemConverter);
  const newDocRef = doc(itemsRef);
  await setDoc(newDocRef, { ...data, id: newDocRef.id });
  return newDocRef.id;
}

export async function updateItem(
  uid: string,
  id: string,
  data: Partial<Omit<Item, "id">>
) {
  const itemRef = doc(getFirestoreDb(), "users", uid, "items", id);
  await updateDoc(itemRef, data);
}

export async function deleteItem(uid: string, id: string) {
  const itemRef = doc(getFirestoreDb(), "users", uid, "items", id);
  await deleteDoc(itemRef);
}

export async function ensureItem(
  uid: string,
  item: Omit<Item, "id">
): Promise<string> {
  // This function is for CSV import, so we keep its specific logic
  const itemsRef = collection(getFirestoreDb(), "users", uid, "items");
  const newRef = doc(itemsRef);
  await setDoc(newRef, item);
  return newRef.id;
}

// --- Goal Functions ---

export async function fetchGoals(uid: string): Promise<Goal[]> {
  const goalsRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "goals"
  ).withConverter(goalConverter);
  const snap = await getDocs(goalsRef);
  return snap.docs.map((d) => d.data());
}

export async function createGoal(uid: string, data: Omit<Goal, "id">) {
  const goalsRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "goals"
  ).withConverter(goalConverter);
  const newDocRef = doc(goalsRef);
  await setDoc(newDocRef, { ...data, id: newDocRef.id });
  return newDocRef.id;
}

export async function updateGoal(
  uid: string,
  id: string,
  data: Partial<Omit<Goal, "id">>
) {
  const goalRef = doc(getFirestoreDb(), "users", uid, "goals", id);
  await updateDoc(goalRef, data);
}

export async function deleteGoal(uid: string, id: string) {
  const goalRef = doc(getFirestoreDb(), "users", uid, "goals", id);
  await deleteDoc(goalRef);
}

// --- Expense Functions ---

export async function fetchExpensesByMonth(
  uid: string,
  year: number,
  monthIndex0: number
): Promise<Expense[]> {
  const expensesRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "expenses"
  ).withConverter(expenseConverter);
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1));
  const q = query(
    expensesRef,
    where("date", ">=", start.toISOString()),
    where("date", "<", end.toISOString()),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function fetchExpensesInRange(
  uid: string,
  startISO: string,
  endISO: string
): Promise<Expense[]> {
  const expensesRef = collection(
    getFirestoreDb(),
    "users",
    uid,
    "expenses"
  ).withConverter(expenseConverter);
  const q = query(
    expensesRef,
    where("date", ">=", startISO),
    where("date", "<", endISO),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function batchAddExpenses(
  uid: string,
  inputs: NewExpenseInput[]
): Promise<void> {
  const expensesRef = collection(getFirestoreDb(), "users", uid, "expenses");
  const batch = writeBatch(getFirestoreDb());
  for (const exp of inputs.filter((e) => e.itemId && e.categoryName)) {
    const expRef = doc(expensesRef);
    batch.set(expRef, {
      date: exp.dateISO,
      itemId: exp.itemId,
      categoryName: exp.categoryName,
      unitCost: exp.unitCost,
      quantity: exp.quantity,
      createdAt: Timestamp.now(),
    });
  }
  await batch.commit();
}

export async function updateExpense(
  uid: string,
  expenseId: string,
  data: Partial<NewExpenseInput>
) {
  const expenseRef = doc(getFirestoreDb(), "users", uid, "expenses", expenseId);
  // Firestore's updateDoc works well with partial data, no need to clean undefined
  await updateDoc(expenseRef, {
    date: data.dateISO,
    ...data,
  });
}
