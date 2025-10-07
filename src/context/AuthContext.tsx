"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dataVersion: number; // ADDED
  refreshData: () => void; // ADDED
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = getFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ADDED: State for triggering data refetches across the app
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = () => setDataVersion((v) => v + 1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        document.cookie = `auth=1; path=/; SameSite=Lax`;
        try {
          const db = getFirestore();
          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          const hasProfile = userDoc.exists();
          if (
            !hasProfile &&
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/onboarding")
          ) {
            router.replace("/onboarding");
          }
        } catch {}
      } else {
        document.cookie = `auth=; Max-Age=0; path=/; SameSite=Lax`;
      }
      setLoading(false);
    });
    return () => unsub();
  }, [auth, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signup: async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
        router.replace("/onboarding");
      },
      login: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      logout: async () => {
        await signOut(auth);
      },
      dataVersion, // ADDED
      refreshData, // ADDED
    }),
    [auth, loading, user, router, dataVersion] // ADDED dataVersion to dependency array
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
