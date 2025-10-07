import {
  fetchCategories,
  fetchExpensesByMonth,
  fetchItems,
  type Category,
  type Expense,
  type Item,
} from "@/lib/firestore";

export type BudgetVsActual = {
  categoryName: string;
  budget: number;
  actual: number;
};
export type CategoryDistribution = { categoryName: string; total: number };

export async function getMonthAnalytics(
  uid: string,
  year: number,
  month0: number
) {
  const [categories, expenses] = await Promise.all([
    fetchCategories(uid),
    fetchExpensesByMonth(uid, year, month0),
  ]);

  const actualByCategory = new Map<string, number>();
  for (const e of expenses) {
    actualByCategory.set(
      e.categoryName,
      (actualByCategory.get(e.categoryName) || 0) + e.unitCost * e.quantity
    );
  }

  const budgetVsActual: BudgetVsActual[] = categories.map((c) => ({
    categoryName: c.name,
    budget: c.monthlyBudget || 0,
    actual: actualByCategory.get(c.name) || 0,
  }));

  const distribution: CategoryDistribution[] = Array.from(
    actualByCategory.entries()
  ).map(([categoryName, total]) => ({ categoryName, total }));

  const totalSpending = expenses.reduce(
    (s, e) => s + e.unitCost * e.quantity,
    0
  );
  const totalBudget = categories.reduce(
    (s, c) => s + (c.monthlyBudget || 0),
    0
  );

  return {
    budgetVsActual,
    distribution,
    totalSpending,
    totalBudget,
  };
}
