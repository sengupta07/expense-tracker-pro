"use client";

declare global {
  interface Window {
    openAddExpense?: () => void;
  }
}

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  batchAddExpenses,
  fetchCategories,
  fetchItems,
  fetchExpensesInRange,
  type Category,
  type Item,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import React from "react";
import { Plus, Trash2 } from "lucide-react";

const itemRowSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().min(1),
});
const categoryBlockSchema = z.object({
  categoryName: z.string().min(1),
  rows: z.array(itemRowSchema),
});
const schema = z.object({
  date: z.string().min(1),
  blocks: z.array(categoryBlockSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

export default function AddExpenseDialog() {
  const { user, refreshData } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [priorSpend, setPriorSpend] = useState(0);
  const [monthlyBudgetTotal, setMonthlyBudgetTotal] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { date: new Date().toISOString().slice(0, 10), blocks: [] },
  });

  const {
    fields: blocks,
    append,
    remove,
    update,
  } = useFieldArray({ control: form.control, name: "blocks" });

  useFieldArray({ control: form.control, name: "blocks.0.rows" });

  useEffect(() => {
    window.openAddExpense = () => setOpen(true);
    return () => {
      delete window.openAddExpense;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      form.reset({ date: new Date().toISOString().slice(0, 10), blocks: [] });
    }
  }, [open, form]);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      const [cats, its] = await Promise.all([
        fetchCategories(user.uid),
        fetchItems(user.uid),
      ]);
      setCategories(cats);
      setItems(its);
      setMonthlyBudgetTotal(
        cats.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0)
      );
    }
    if (user?.uid) {
      load();
    }
  }, [user?.uid, open]);

  useEffect(() => {
    async function loadPrior() {
      if (!user?.uid) return;
      const d = form.watch("date");
      if (!d) return;
      const date = new Date(d);
      const startOfMonth = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
      );
      const dayStart = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      );
      const res = await fetchExpensesInRange(
        user.uid,
        startOfMonth.toISOString(),
        dayStart.toISOString()
      );
      const sum = res.reduce((s, e) => s + e.unitCost * e.quantity, 0);
      setPriorSpend(sum);
    }
    if (user?.uid) {
      loadPrior();
    }
  }, [user?.uid, form.watch("date")]);

  const sessionTotal = useMemo(() => {
    const vals = form.watch();
    return (vals.blocks ?? []).reduce((blockTotal, b) => {
      return (
        blockTotal +
        (b.rows ?? []).reduce((rowTotal, r) => {
          const item = items.find((i) => i.id === r.itemId);
          return rowTotal + (item?.cost || 0) * (r.quantity || 0);
        }, 0)
      );
    }, 0);
  }, [form.watch("blocks"), items]);

  const todayBudget = useMemo(() => {
    const dStr = form.watch("date");
    if (!dStr) return { daily: 0, rollover: 0, available: 0 };
    const d = new Date(dStr);
    const daysInMonth = new Date(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      0
    ).getUTCDate();
    const daily = monthlyBudgetTotal > 0 ? monthlyBudgetTotal / daysInMonth : 0;
    const dayIndex = d.getUTCDate();
    const budgetUpToPrev = daily * (dayIndex - 1);
    const rollover = budgetUpToPrev - priorSpend;
    const available = daily + rollover - sessionTotal;
    return { daily, rollover, available };
  }, [form.watch("date"), monthlyBudgetTotal, priorSpend, sessionTotal]);

  const affordableClass = (cost: number) => {
    const remainingAfter = todayBudget.available - cost;
    if (remainingAfter >= 0) return "text-green-400";
    return "text-red-400";
  };

  const addBlock = () =>
    append({ categoryName: "", rows: [{ itemId: "", quantity: 1 }] });
  const addRow = (blockIdx: number) => {
    const current = form.getValues(`blocks.${blockIdx}.rows`) ?? [];
    update(blockIdx, {
      ...blocks[blockIdx],
      rows: [...current, { itemId: "", quantity: 1 }],
    });
  };
  const removeRow = (blockIdx: number, rowIdx: number) => {
    const current = form.getValues(`blocks.${blockIdx}.rows`) ?? [];
    update(blockIdx, {
      ...blocks[blockIdx],
      rows: current.filter((_, i) => i !== rowIdx),
    });
  };

  async function onSubmit(values: FormValues) {
    if (!user?.uid) return;
    const dateISO = new Date(values.date).toISOString();
    const inputs = values.blocks.flatMap((b) =>
      (b.rows ?? []).map((r) => {
        const item = items.find((i) => i.id === r.itemId);
        return {
          dateISO,
          itemId: r.itemId,
          categoryName: b.categoryName,
          unitCost: item?.cost ?? 0,
          quantity: r.quantity,
        };
      })
    );
    await batchAddExpenses(user.uid, inputs);
    setOpen(false);
    refreshData();
  }

  const itemsByCategory = (name: string) =>
    items.filter((i) => i.categoryName === name);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
          + Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-0 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Log Daily Expenses</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {/* CORRECTED: Responsive Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 p-3 bg-white/5 rounded-lg">
            <div className="space-y-2 w-full sm:w-auto">
              <Label className="text-gray-300">Date of Expense</Label>
              <Input
                type="date"
                {...form.register("date")}
                className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400 dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex justify-between sm:justify-end gap-4 text-right">
              <div>
                <p className="text-xs text-gray-400">Daily Budget</p>
                <p className="font-semibold">₹{todayBudget.daily.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Rollover</p>
                <p className="font-semibold">
                  ₹{todayBudget.rollover.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Remaining</p>
                <p
                  className={`font-bold text-lg ${
                    todayBudget.available >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  ₹{todayBudget.available.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className="space-y-3 bg-white/5 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <Select
                    value={form.watch(`blocks.${idx}.categoryName`) || ""}
                    onValueChange={(v) =>
                      form.setValue(`blocks.${idx}.categoryName`, v)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-1/2 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-0 text-white">
                      {categories.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.name}
                          className="focus:bg-white/20 focus:text-white"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(form.watch(`blocks.${idx}.rows`) ?? []).map((row, rIdx) => {
                  const list = itemsByCategory(
                    form.watch(`blocks.${idx}.categoryName`) || ""
                  );
                  const selected = items.find(
                    (i) =>
                      i.id === form.watch(`blocks.${idx}.rows.${rIdx}.itemId`)
                  );
                  const total =
                    (selected?.cost || 0) *
                    (form.watch(`blocks.${idx}.rows.${rIdx}.quantity`) || 0);

                  return (
                    // CORRECTED: Responsive Item Row
                    <div
                      key={rIdx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <div className="flex-1">
                        <Select
                          value={
                            form.watch(`blocks.${idx}.rows.${rIdx}.itemId`) ||
                            ""
                          }
                          onValueChange={(v) =>
                            form.setValue(
                              `blocks.${idx}.rows.${rIdx}.itemId`,
                              v
                            )
                          }
                        >
                          <SelectTrigger className="bg-white/10 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400">
                            <SelectValue placeholder="Select Item" />
                          </SelectTrigger>
                          <SelectContent className="glassmorphism border-0 text-white">
                            {list.map((i) => (
                              <SelectItem
                                key={i.id}
                                value={i.id}
                                className="focus:bg-white/20 focus:text-white"
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span>{i.name}</span>
                                  <span className={affordableClass(i.cost)}>
                                    ₹{i.cost.toFixed(2)}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="Qty"
                          {...form.register(
                            `blocks.${idx}.rows.${rIdx}.quantity`,
                            { valueAsNumber: true }
                          )}
                          className="bg-white/10 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400 w-20"
                        />
                        <div className="text-gray-300 w-24 text-right">
                          ={" "}
                          <span className="font-semibold text-white ml-1">
                            ₹{total.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:bg-white/20 hover:text-gray-200"
                          onClick={() => removeRow(idx, rIdx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-indigo-400 hover:bg-white/10 hover:text-indigo-300"
                  onClick={() => addRow(idx)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 flex-col-reverse sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-indigo-400 hover:bg-white/10 hover:text-indigo-300"
              onClick={addBlock}
            >
              + Add Category Block
            </Button>
            <Button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Save Expenses
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
