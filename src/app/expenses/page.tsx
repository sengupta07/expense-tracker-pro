"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchExpensesByMonth,
  type Expense,
  fetchItems,
  type Item,
  fetchCategories,
  type Category,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionSection } from "@/components/MotionSection";
import { HandCoins, Loader2, PackageOpen, Pencil } from "lucide-react";

const AddExpenseDialog = dynamic(() => import("./AddExpenseDialog"), {
  ssr: false,
});
const EditExpenseDialog = dynamic(() => import("./EditExpenseDialog"), {
  ssr: false,
});
const CsvActions = dynamic(() => import("./CsvActions"), { ssr: false });

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default function ExpensesPage() {
  const { user, dataVersion, refreshData } = useAuth();
  const [ym, setYm] = useState(getCurrentYearMonth());
  const [data, setData] = useState<Expense[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const [rows, its, cats] = await Promise.all([
          fetchExpensesByMonth(user.uid, ym.year, ym.month),
          fetchItems(user.uid),
          fetchCategories(user.uid),
        ]);
        setData(rows);
        setItems(its);
        setCategories(cats);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.uid, ym, dataVersion]);

  const changeMonth = (delta: number) => {
    const date = new Date(ym.year, ym.month + delta, 1);
    setYm({ year: date.getFullYear(), month: date.getMonth() });
  };

  const monthLabel = useMemo(
    () =>
      new Date(ym.year, ym.month, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [ym]
  );
  const itemNameById = (id: string) =>
    items.find((i) => i.id === id)?.name || id;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-2" />
          <span className="text-gray-300">Loading Expenses...</span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <PackageOpen className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white">
            No Expenses Recorded
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Click &quot;+ Add Expense&quot; to log your first transaction for
            this month.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 hover:bg-transparent">
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Category</TableHead>
                <TableHead className="text-white">Item</TableHead>
                <TableHead className="text-right text-white">Qty</TableHead>
                <TableHead className="text-right text-white">
                  Unit Cost
                </TableHead>
                <TableHead className="text-right text-white">Total</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow
                  key={e.id}
                  className="border-b-white/10 hover:bg-white/5"
                >
                  <TableCell className="font-medium">
                    {new Date(e.date).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {e.categoryName}
                  </TableCell>
                  <TableCell>{itemNameById(e.itemId)}</TableCell>
                  <TableCell className="text-right text-gray-300">
                    {e.quantity}
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
                    ₹{e.unitCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{(e.unitCost * e.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingExpense(e)}
                      className="text-gray-300 hover:bg-white/20 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden space-y-3">
          {data.map((e) => (
            <div key={e.id} className="bg-white/5 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-white">
                    {itemNameById(e.itemId)}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    {e.categoryName} • {new Date(e.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">
                    ₹{(e.unitCost * e.quantity).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {e.quantity} x ₹{e.unitCost.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingExpense(e)}
                  className="text-gray-300 hover:bg-white/20 hover:text-white -mr-2"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      <EditExpenseDialog
        key={editingExpense?.id || "new-expense"}
        expense={editingExpense}
        categories={categories}
        items={items}
        onOpenChange={() => setEditingExpense(null)}
        onSave={refreshData}
      />
      <MotionSection>
        <div className="space-y-4">
          <Card className="glassmorphism text-white border-0">
            <CardHeader>
              {/* CORRECTED: Responsive Header */}
              <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <HandCoins />
                  Monthly Expenses
                </CardTitle>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="glassmorphism flex items-center gap-1 p-1 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => changeMonth(-1)}
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      Prev
                    </Button>
                    <span className="px-2 text-center font-medium text-white text-sm">
                      {monthLabel}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => changeMonth(1)}
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <CsvActions year={ym.year} month={ym.month} />
                    <AddExpenseDialog />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
          </Card>
        </div>
      </MotionSection>
    </>
  );
}
