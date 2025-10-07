"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getFirestoreDb } from "@/lib/firebase";
import { doc, writeBatch, collection } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Step1, Step2, Step3, Step4, Step5 } from "./steps";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  monthlyBudget: z.number().min(0),
});

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cost: z.number().min(0),
});

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().min(0),
  targetDate: z.string().min(1, "Date is required"),
});

const onboardingSchema = z.object({
  categories: z.array(categorySchema).min(1, "Add at least one category."),
  usualItems: z.array(
    z.object({ categoryName: z.string(), items: z.array(itemSchema) })
  ),
  luxuryItems: z.array(
    z.object({ categoryName: z.string(), items: z.array(itemSchema) })
  ),
  goals: z.array(goalSchema).min(1, "Add at least one goal."),
  salary: z.number().min(0, "Salary must be a positive number."),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { user, refreshData } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      categories: [{ name: "Food & Groceries", monthlyBudget: 15000 }],
      usualItems: [],
      luxuryItems: [],
      goals: [],
      salary: 50000,
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const handleNext = async () => {
    let isValid = true;
    if (currentStep === 1) {
      isValid = await form.trigger("categories");
    }
    if (currentStep === 4) {
      isValid = await form.trigger("goals");
    }

    if (isValid) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!user?.uid) return alert("You must be logged in.");

    const db = getFirestoreDb();
    const userDocRef = doc(db, "users", user.uid);
    const batch = writeBatch(db);

    batch.set(userDocRef, { salary: data.salary }, { merge: true });

    data.categories.forEach((c) => {
      batch.set(doc(collection(userDocRef, "categories")), c);
    });

    const processItems = (
      items: {
        categoryName: string;
        items: { name: string; cost: number }[];
      }[],
      type: "usual" | "luxury"
    ) => {
      items.forEach((categoryGroup) => {
        categoryGroup.items.forEach((item) => {
          batch.set(doc(collection(userDocRef, "items")), {
            ...item,
            categoryName: categoryGroup.categoryName,
            type,
          });
        });
      });
    };

    processItems(data.usualItems, "usual");
    processItems(data.luxuryItems, "luxury");

    data.goals.forEach((g) => {
      batch.set(doc(collection(userDocRef, "goals")), g);
    });

    await batch.commit();
    refreshData();
    router.push("/dashboard");
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-semibold text-white">
            Let&apos;s Get You Set Up
          </h1>
          <span className="text-sm text-gray-300">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2 bg-white/20"
          indicatorClassName="bg-indigo-400"
        />
      </div>

      <div className="min-h-[400px]">
        {currentStep === 1 && <Step1 form={form} />}
        {currentStep === 2 && <Step2 form={form} />}
        {currentStep === 3 && <Step3 form={form} />}
        {currentStep === 4 && <Step4 form={form} />}
        {currentStep === 5 && <Step5 form={form} />}
      </div>

      <div className="flex justify-between items-center pt-4">
        <div>
          {currentStep > 1 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Back
            </Button>
          )}
        </div>
        <div>
          {currentStep < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Finish Setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
