"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchUser,
  updateUser,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  type Category,
  type Item,
  type Goal,
} from "@/lib/firestore";
import {
  CategoryDialog,
  ItemDialog,
  GoalDialog,
  ConfirmDeleteDialog,
  type CategoryFormValues,
  type ItemFormValues,
  type GoalFormValues,
} from "./EditDialogs";
import { MotionSection } from "@/components/MotionSection";
import { motion } from "framer-motion";
import { User, Shapes, ListTodo, Target, Pencil, Trash2 } from "lucide-react";

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const listItemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function ProfilePage() {
  const { user, refreshData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [salary, setSalary] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingCategory, setEditingCategory] =
    useState<Partial<Category> | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      const [u, cats, its, gs] = await Promise.all([
        fetchUser(user.uid),
        fetchCategories(user.uid),
        fetchItems(user.uid),
        fetchGoals(user.uid),
      ]);
      setSalary(u?.salary || 0);
      setCategories(cats);
      setItems(its);
      setGoals(gs);
    }
    load();
  }, [user?.uid, refreshData]);

  async function saveSalary() {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateUser(user.uid, { salary: Number(salary) || 0 });
      refreshData();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCategory(values: CategoryFormValues) {
    if (!user?.uid) return;
    if (editingCategory?.id) {
      await updateCategory(user.uid, editingCategory.id, values);
    } else {
      await createCategory(user.uid, values);
    }
    setEditingCategory(null);
    refreshData();
  }

  async function removeCategory() {
    if (!user?.uid || !deletingCategory) return;
    await deleteCategory(user.uid, deletingCategory.id);
    setDeletingCategory(null);
    refreshData();
  }

  async function handleSaveItem(values: ItemFormValues) {
    if (!user?.uid) return;

    // Find the full category object to get the categoryName
    const category = categories.find((c) => c.id === values.categoryId);
    if (!category) return;

    const itemData = { ...values, categoryName: category.name };

    if (editingItem?.id) {
      await updateItem(user.uid, editingItem.id, itemData);
    } else {
      await createItem(user.uid, itemData);
    }
    setEditingItem(null);
    refreshData();
  }

  async function removeItem() {
    if (!user?.uid || !deletingItem) return;
    await deleteItem(user.uid, deletingItem.id);
    setDeletingItem(null);
    refreshData();
  }

  async function handleSaveGoal(values: GoalFormValues) {
    if (!user?.uid) return;
    if (editingGoal?.id) {
      await updateGoal(user.uid, editingGoal.id, values);
    } else {
      await createGoal(user.uid, { ...values, amountSaved: 0 });
    }
    setEditingGoal(null);
    refreshData();
  }

  async function removeGoal() {
    if (!user?.uid || !deletingGoal) return;
    await deleteGoal(user.uid, deletingGoal.id);
    setDeletingGoal(null);
    refreshData();
  }

  const openDeleteDialog = (
    item: Category | Item | Goal,
    type: "category" | "item" | "goal"
  ) => {
    if (type === "category") setDeletingCategory(item as Category);
    if (type === "item") setDeletingItem(item as Item);
    if (type === "goal") setDeletingGoal(item as Goal);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeletion = () => {
    if (deletingCategory) removeCategory();
    if (deletingItem) removeItem();
    if (deletingGoal) removeGoal();
  };

  return (
    <div className="space-y-4">
      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
      <ItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
        categories={categories}
      />
      <GoalDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />
      <ConfirmDeleteDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDeletion}
      />
      <MotionSection>
        <Card className="glassmorphism text-white border-0">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="salary" className="w-full">
              <TabsList className="bg-white/10 p-1 h-auto">
                <TabsTrigger
                  value="salary"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
                >
                  Salary
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
                >
                  Categories
                </TabsTrigger>
                <TabsTrigger
                  value="items"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
                >
                  Items
                </TabsTrigger>
                <TabsTrigger
                  value="goals"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
                >
                  Goals
                </TabsTrigger>
              </TabsList>

              <TabsContent value="salary" className="space-y-4 pt-6">
                <div className="max-w-xs space-y-2">
                  <Label className="text-gray-300">Monthly salary (₹)</Label>
                  <Input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value || 0))}
                    className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <Button
                  onClick={saveSalary}
                  disabled={saving}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {saving ? "Saving..." : "Save Salary"}
                </Button>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4 pt-6">
                <Button
                  onClick={() => {
                    setEditingCategory({});
                    setIsCategoryDialogOpen(true);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  + Add Category
                </Button>
                <motion.div
                  className="space-y-2"
                  variants={listContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {categories.map((c) => (
                    <motion.div
                      key={c.id}
                      variants={listItemVariants}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Shapes className="h-6 w-6 text-indigo-400" />
                        <div>
                          <div className="font-medium text-white">{c.name}</div>
                          <div className="text-sm text-gray-300">
                            Budget: ₹{c.monthlyBudget.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-white/20 hover:text-white"
                          onClick={() => {
                            setEditingCategory(c);
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                          onClick={() => openDeleteDialog(c, "category")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="items" className="space-y-4 pt-6">
                <Button
                  onClick={() => {
                    setEditingItem({});
                    setIsItemDialogOpen(true);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  + Add Item
                </Button>
                <motion.div
                  className="space-y-2"
                  variants={listContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {items.map((i) => (
                    <motion.div
                      key={i.id}
                      variants={listItemVariants}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <ListTodo className="h-6 w-6 text-indigo-400" />
                        <div>
                          <div className="font-medium text-white">{i.name}</div>
                          <div className="text-sm text-gray-300">
                            {i.categoryName} •{" "}
                            <span className="capitalize">{i.type}</span> • ₹
                            {i.cost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-white/20 hover:text-white"
                          onClick={() => {
                            setEditingItem(i);
                            setIsItemDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                          onClick={() => openDeleteDialog(i, "item")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4 pt-6">
                <Button
                  onClick={() => {
                    setEditingGoal({});
                    setIsGoalDialogOpen(true);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  + Add Goal
                </Button>
                <motion.div
                  className="space-y-2"
                  variants={listContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {goals.map((g) => (
                    <motion.div
                      key={g.id}
                      variants={listItemVariants}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Target className="h-6 w-6 text-indigo-400" />
                        <div>
                          <div className="font-medium text-white">{g.name}</div>
                          <div className="text-sm text-gray-300">
                            Target: ₹{g.targetAmount.toLocaleString()} by{" "}
                            {new Date(g.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-white/20 hover:text-white"
                          onClick={() => {
                            setEditingGoal(g);
                            setIsGoalDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:bg-red-500/20 hover:text-red-400"
                          onClick={() => openDeleteDialog(g, "goal")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </MotionSection>
    </div>
  );
}
