// in /app/onboarding/steps.tsx
"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { OnboardingFormValues } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";

type StepProps = {
  form: UseFormReturn<OnboardingFormValues>;
};

export function Step1({ form }: StepProps) {
  // Destructure errors from formState to display validation messages
  const {
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Monthly Budgets</h2>
      <p className="text-sm text-gray-300 mb-6">
        Define your main spending categories and their monthly budget.
      </p>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label className="text-gray-300">Category Name</Label>
                <Input
                  {...form.register(`categories.${index}.name`)}
                  placeholder="e.g., Entertainment"
                  className="bg-white/20 border-0 text-white focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="w-40 space-y-2">
                <Label className="text-gray-300">Budget (₹)</Label>
                <Input
                  type="number"
                  {...form.register(`categories.${index}.monthlyBudget`, {
                    valueAsNumber: true,
                  })}
                  placeholder="e.g., 5000"
                  className="bg-white/20 border-0 text-white focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {/* ADDED: Display per-row error messages */}
            {errors.categories?.[index]?.name && (
              <p className="text-xs text-red-400 mt-1">
                {errors.categories[index]?.name?.message}
              </p>
            )}
            {errors.categories?.[index]?.monthlyBudget && (
              <p className="text-xs text-red-400 mt-1">
                {errors.categories[index]?.monthlyBudget?.message}
              </p>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() => append({ name: "", monthlyBudget: 0 })}
          className="w-full text-indigo-400 hover:bg-white/10 hover:text-indigo-300"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
        {/* ADDED: Display the "add at least one" error message */}
        {errors.categories?.root && (
          <p className="text-sm text-red-400 text-center mt-2">
            {errors.categories.root.message}
          </p>
        )}
      </div>
    </div>
  );
}

function ItemsStep({
  form,
  step,
  type,
}: StepProps & { step: 2 | 3; type: "usual" | "luxury" }) {
  const fieldName = type === "usual" ? "usualItems" : "luxuryItems";
  const { fields, update } = useFieldArray({
    control: form.control,
    name: fieldName,
  });

  useEffect(() => {
    const categories = form.getValues("categories");
    if (fields.length === 0 && categories.length > 0) {
      form.setValue(
        fieldName,
        categories.map((c) => ({ categoryName: c.name, items: [] }))
      );
    }
  }, [form, fields.length, fieldName]);

  const addItemRow = (index: number) => {
    const current = form.getValues(`${fieldName}.${index}.items`) ?? [];
    update(index, {
      ...fields[index],
      items: [...current, { name: "", cost: 0 }],
    });
  };

  const removeItemRow = (index: number, itemIdx: number) => {
    const current = form.getValues(`${fieldName}.${index}.items`) ?? [];
    update(index, {
      ...fields[index],
      items: current.filter((_, i) => i !== itemIdx),
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">
        Step {step}: {type === "usual" ? "Usual Expenses" : "Luxury Items"}
      </h2>
      <p className="text-sm text-gray-300 mb-6">
        List some {type} items you frequently buy for each category.
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 bg-white/5 rounded-lg space-y-3">
            <h3 className="font-semibold text-indigo-300">
              {field.categoryName}
            </h3>
            {(form.watch(`${fieldName}.${index}.items`) ?? []).map(
              (_, itemIdx) => (
                <div key={itemIdx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label className="text-gray-300 text-xs">Item Name</Label>
                    <Input
                      {...form.register(
                        `${fieldName}.${index}.items.${itemIdx}.name`
                      )}
                      placeholder="e.g., Coffee"
                      className="bg-white/20 border-0 text-white h-9 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-gray-300 text-xs">Cost (₹)</Label>
                    <Input
                      type="number"
                      {...form.register(
                        `${fieldName}.${index}.items.${itemIdx}.cost`,
                        { valueAsNumber: true }
                      )}
                      placeholder="e.g., 200"
                      className="bg-white/20 border-0 text-white h-9 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItemRow(index, itemIdx)}
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => addItemRow(index)}
              className="w-full text-indigo-400 hover:bg-white/10 hover:text-indigo-300 text-xs"
            >
              <Plus className="h-4 w-4 mr-2" /> Add {field.categoryName} Item
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Step2 = (props: StepProps) => (
  <ItemsStep {...props} step={2} type="usual" />
);
export const Step3 = (props: StepProps) => (
  <ItemsStep {...props} step={3} type="luxury" />
);

export function Step4({ form }: StepProps) {
  const {
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "goals",
  });
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">
        Step 4: Financial Goals
      </h2>
      <p className="text-sm text-gray-300 mb-6">
        What are you saving for? Let&apos;s set some targets.
      </p>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="p-3 bg-white/5 rounded-lg space-y-1">
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5 space-y-2">
                <Label className="text-gray-300">Goal Name</Label>
                <Input
                  {...form.register(`goals.${index}.name`)}
                  placeholder="e.g., New Laptop"
                  className="bg-white/20 border-0 text-white focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label className="text-gray-300">Target (₹)</Label>
                <Input
                  type="number"
                  {...form.register(`goals.${index}.targetAmount`, {
                    valueAsNumber: true,
                  })}
                  placeholder="e.g., 120000"
                  className="bg-white/20 border-0 text-white focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label className="text-gray-300">Target Date</Label>
                <Input
                  type="date"
                  {...form.register(`goals.${index}.targetDate`)}
                  className="bg-white/20 border-0 text-white focus:ring-1 focus:ring-indigo-400 dark:[color-scheme:dark]"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* ADDED: Display per-row goal error messages */}
            {errors.goals?.[index]?.name && (
              <p className="text-xs text-red-400 mt-1 pl-1">
                {errors.goals[index]?.name?.message}
              </p>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            append({
              name: "",
              targetAmount: 0,
              targetDate: new Date().toISOString().slice(0, 10),
            })
          }
          className="w-full text-indigo-400 hover:bg-white/10 hover:text-indigo-300"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
        {/* ADDED: Display the "add at least one" error message */}
        {errors.goals?.root && (
          <p className="text-sm text-red-400 text-center mt-2">
            {errors.goals.root.message}
          </p>
        )}
      </div>
    </div>
  );
}

export function Step5({ form }: StepProps) {
  const {
    formState: { errors },
  } = form;
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">
        Step 5: Your Income
      </h2>
      <p className="text-sm text-gray-300 mb-6">
        Finally, what is your monthly salary? This helps in calculating your
        savings potential.
      </p>
      <div className="max-w-xs space-y-2">
        <Label className="text-gray-300">Monthly Salary (₹)</Label>
        <Input
          type="number"
          {...form.register("salary", { valueAsNumber: true })}
          placeholder="e.g., 75000"
          className="bg-white/20 border-0 text-white focus:ring-1 focus:ring-indigo-400"
        />
        {/* ADDED: Display salary error message */}
        {errors.salary && (
          <p className="text-xs text-red-400 mt-1">{errors.salary.message}</p>
        )}
      </div>
    </div>
  );
}
