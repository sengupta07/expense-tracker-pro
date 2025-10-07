"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  fetchExpensesByMonth,
  fetchItems,
  ensureItem,
  batchAddExpenses,
  type Item,
  fetchCategories, // ADDED
  createCategory, // ADDED
  type Category,
  NewExpenseInput, // ADDED
} from "@/lib/firestore";
import { useState } from "react";
import { FileDown, FileUp, Loader2 } from "lucide-react";

export default function CsvActions({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function exportCsv() {
    if (!user?.uid) return;
    setBusy(true);
    try {
      const rows = await fetchExpensesByMonth(user.uid, year, month);
      const items = await fetchItems(user.uid);
      const itemMap = new Map(items.map((i) => [i.id, i.name]));

      const header = ["date", "category", "item", "cost", "quantity"];
      const body = rows.map((r) => [
        new Date(r.date).toISOString().slice(0, 10),
        r.categoryName,
        itemMap.get(r.itemId) || "Unknown Item",
        r.unitCost.toString(),
        r.quantity.toString(),
      ]);
      const csv = [header, ...body]
        .map((arr) =>
          arr.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${year}-${String(month + 1).padStart(2, "0")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file || !user?.uid) return;
    setBusy(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines.map((l) =>
        l
          .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"'))
      );
      const idx = {
        date: header.indexOf("date"),
        category: header.indexOf("category"),
        item: header.indexOf("item"),
        cost: header.indexOf("cost"),
        quantity: header.indexOf("quantity"),
      };
      const inputs = rows.map((r) => ({
        dateISO: new Date(r[idx.date]).toISOString(),
        categoryName: r[idx.category],
        itemName: r[idx.item],
        unitCost: Number(r[idx.cost] || 0),
        quantity: Number(r[idx.quantity] || 1),
      }));

      // CORRECTED: Fetch existing categories and items to avoid duplicates
      const [existingCategories, existingItems]: [Category[], Item[]] =
        await Promise.all([fetchCategories(user.uid), fetchItems(user.uid)]);

      // Helper to find or create a category and return its ID
      const ensureCategoryId = async (name: string) => {
        const found = existingCategories.find((c) => c.name === name);
        if (found) return found.id;
        const id = await createCategory(user.uid, { name, monthlyBudget: 0 });
        existingCategories.push({ id, name, monthlyBudget: 0 });
        return id;
      };

      // Helper to find or create an item and return its ID
      const ensureItemId = async (
        name: string,
        categoryName: string,
        categoryId: string,
        unitCost: number
      ) => {
        const found = existingItems.find(
          (i) => i.name === name && i.categoryName === categoryName
        );
        if (found) return found.id;

        // The object passed to ensureItem now includes the required categoryId
        const id = await ensureItem(user.uid!, {
          name,
          cost: unitCost,
          categoryName,
          categoryId,
          type: "usual",
        });

        // The object pushed to the local array also includes categoryId
        existingItems.push({
          id,
          name,
          cost: unitCost,
          categoryName,
          categoryId,
          type: "usual",
        });
        return id;
      };

      const batched: NewExpenseInput[] = [];

      for (const r of inputs) {
        // First, get the category ID
        const categoryId = await ensureCategoryId(r.categoryName);
        // Then, get the item ID using the category ID
        const itemId = await ensureItemId(
          r.itemName,
          r.categoryName,
          categoryId,
          r.unitCost
        );
        batched.push({
          dateISO: r.dateISO,
          itemId,
          categoryName: r.categoryName,
          unitCost: r.unitCost,
          quantity: r.quantity,
        });
      }
      await batchAddExpenses(user.uid, batched);
      alert("Import complete");
      ev.target.value = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        onClick={exportCsv}
        disabled={busy}
        className="text-white hover:bg-white/10 hover:text-white"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        asChild
        disabled={busy}
        className="text-white hover:bg-white/10 hover:text-white"
      >
        <label>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={importCsv}
          />
        </label>
      </Button>
    </div>
  );
}
