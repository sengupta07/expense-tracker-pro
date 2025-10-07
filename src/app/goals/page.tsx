"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  amountSaved: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [avgMonthlyExpenses, setAvgMonthlyExpenses] = useState<number>(0);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      const db = getFirestoreDb();

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setSalary(userDocSnap.data().salary || 0);
      }

      const goalsSnap = await getDocs(collection(userDocRef, "goals"));
      const goalsList = goalsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          targetAmount: data.targetAmount,
          targetDate: data.targetDate,
          amountSaved: data.amountSaved || 0,
        } as Goal;
      });
      setGoals(goalsList);

      setAvgMonthlyExpenses(0);
    }
    load();
  }, [user?.uid]);

  const enrichedGoals = useMemo(() => {
    const today = new Date();
    const averageActualSavings = Math.max(0, salary - avgMonthlyExpenses);

    return goals
      .map((g) => {
        const targetDate = new Date(g.targetDate);
        const monthsRemaining = Math.max(
          1,
          (targetDate.getFullYear() - today.getFullYear()) * 12 +
            (targetDate.getMonth() - today.getMonth())
        );

        const requiredMonthlySaving = Math.max(
          0,
          (g.targetAmount - g.amountSaved) / monthsRemaining
        );

        const feasibilityRatio =
          averageActualSavings > 0
            ? requiredMonthlySaving / averageActualSavings
            : Infinity;

        let statusColor = "bg-green-500";
        let statusText = "On Track";
        if (feasibilityRatio > 1.25) {
          statusColor = "bg-red-500";
          statusText = "At Risk";
        } else if (feasibilityRatio > 1.0) {
          statusColor = "bg-yellow-500";
          statusText = "Requires Focus";
        }

        const progressPct = Math.min(
          100,
          Math.round((g.amountSaved / Math.max(1, g.targetAmount)) * 100)
        );

        return {
          ...g,
          requiredMonthlySaving,
          statusColor,
          statusText,
          progressPct,
        };
      })
      .sort((a, b) => a.progressPct - b.progressPct);
  }, [goals, salary, avgMonthlyExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Your Goals</h1>
      </div>

      {enrichedGoals.length > 0 ? (
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {enrichedGoals.map((g) => (
            <motion.div key={g.id} variants={itemVariants}>
              <Card className="glassmorphism text-white border-0 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-indigo-400" />
                    <CardTitle className="text-lg font-semibold text-white">
                      {g.name}
                    </CardTitle>
                  </div>
                  <div
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5",
                      g.statusColor
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse"></span>
                    {g.statusText}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-gray-300">Progress</span>
                      <span className="text-lg font-semibold text-white">
                        {g.progressPct}%
                      </span>
                    </div>
                    <Progress
                      value={g.progressPct}
                      className="h-2 bg-white/20"
                      indicatorClassName={g.statusColor}
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>₹{g.amountSaved.toLocaleString()}</span>
                      <span>₹{g.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-md">
                    <span className="text-gray-300">
                      Required Monthly Saving
                    </span>
                    <span className="font-semibold text-lg text-white">
                      ₹
                      {g.requiredMonthlySaving.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-10 glassmorphism rounded-lg">
          <Target className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Goals Set Yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Visit your profile to add your first financial goal.
          </p>
        </div>
      )}
    </div>
  );
}
