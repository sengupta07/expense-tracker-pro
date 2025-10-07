// in /app/expenses/EditExpenseDialog.tsx
"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useAuth } from "@/context/AuthContext";
import {
  updateExpense,
  type Expense,
  type Category,
  type Item,
} from "@/lib/firestore";
import { Loader2 } from "lucide-react";

const schema = z.object({
  date: z.string().min(1, "Date is required."),
  categoryId: z.string().min(1, "Category is required."),
  itemId: z.string().min(1, "Item is required."),
  quantity: z.number().min(1, "Quantity must be at least 1."),
});

type FormValues = z.infer<typeof schema>;

type EditExpenseDialogProps = {
  expense: Expense | null;
  categories: Category[];
  items: Item[];
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
};

export default function EditExpenseDialog({
  expense,
  categories,
  items,
  onOpenChange,
  onSave,
}: EditExpenseDialogProps) {
  const { user } = useAuth();

  // Calculate default values BEFORE initializing the form
  const defaultVals = useMemo(() => {
    if (!expense) return {};
    const item = items.find((i) => i.id === expense.itemId);
    return {
      date: new Date(expense.date).toISOString().slice(0, 10),
      categoryId: item?.categoryId || "",
      itemId: expense.itemId,
      quantity: expense.quantity,
    };
  }, [expense, items]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultVals,
  });

  const {
    formState: { isSubmitting, errors },
    watch,
    setValue,
    control,
    register,
  } = form;

  const selectedCategoryId = watch("categoryId");
  const filteredItems = items.filter(
    (item) => item.categoryId === selectedCategoryId
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!user?.uid || !expense?.id) return;

    const selectedItem = items.find((i) => i.id === data.itemId);
    if (!selectedItem) return;

    const selectedCategory = categories.find(
      (c) => c.id === selectedItem.categoryId
    );
    if (!selectedCategory) return;

    await updateExpense(user.uid, expense.id, {
      dateISO: new Date(data.date).toISOString(),
      categoryName: selectedCategory.name,
      itemId: data.itemId,
      quantity: data.quantity,
      unitCost: selectedItem.cost,
    });
    onSave();
    onOpenChange(false);
  });

  return (
    <Dialog open={!!expense} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Expense</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label className="text-gray-300">Date</Label>
            <Input
              type="date"
              {...register("date")}
              className="bg-white/20 border-0 text-white dark:[color-scheme:dark]"
            />
            {errors.date && (
              <p className="text-xs text-red-400 mt-1">{errors.date.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("itemId", "");
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="bg-white/20 border-0 text-white">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-0 text-white">
                      {categories.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                          className="focus:bg-white/20"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Item</Label>
              <Controller
                control={control}
                name="itemId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger className="bg-white/20 border-0 text-white">
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism border-0 text-white">
                      {filteredItems.map((i) => (
                        <SelectItem
                          key={i.id}
                          value={i.id}
                          className="focus:bg-white/20"
                        >
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.itemId && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.itemId.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Quantity</Label>
            <Input
              type="number"
              {...register("quantity", { valueAsNumber: true })}
              className="bg-white/20 border-0 text-white"
            />
            {errors.quantity && (
              <p className="text-xs text-red-400 mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
