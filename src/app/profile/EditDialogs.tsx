"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Item, Goal } from "@/lib/firestore";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  monthlyBudget: z.number().min(0),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Partial<Category> | null;
  onSave: (values: CategoryFormValues) => void;
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      monthlyBudget: category?.monthlyBudget || 0,
    },
  });

  useEffect(() => {
    form.reset({
      name: category?.name || "",
      monthlyBudget: category?.monthlyBudget || 0,
    });
  }, [category, form]);

  const handleSave = (values: CategoryFormValues) => {
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {category?.id ? "Edit" : "Add"} Category
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Category Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">
                    Monthly Budget
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  cost: z.number().min(0),
  type: z.enum(["usual", "luxury"]),
});
export type ItemFormValues = z.infer<typeof itemSchema>;

export function ItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Partial<Item> | null;
  onSave: (values: ItemFormValues) => void;
  categories: Category[];
}) {
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || "",
      categoryId: item?.categoryId || "", // Use categoryId
      cost: item?.cost || 0,
      type: item?.type || "usual",
    },
  });

  useEffect(() => {
    form.reset({
      name: item?.name || "",
      categoryId: item?.categoryId || "", // Use categoryId
      cost: item?.cost || 0,
      type: item?.type || "usual",
    });
  }, [item, form]);

  const handleSave = (values: ItemFormValues) => {
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {item?.id ? "Edit" : "Add"} Item
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Item Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId" // Use categoryId
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glassmorphism border-0 text-white">
                      {categories.map((c) => (
                        // The value is now the category ID
                        <SelectItem
                          key={c.id}
                          value={c.id}
                          className="focus:bg-white/20 focus:text-white"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glassmorphism border-0 text-white">
                      <SelectItem
                        value="usual"
                        className="focus:bg-white/20 focus:text-white"
                      >
                        Usual
                      </SelectItem>
                      <SelectItem
                        value="luxury"
                        className="focus:bg-white/20 focus:text-white"
                      >
                        Luxury
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().min(0),
  targetDate: z.string().min(1, "Target date is required"),
});
export type GoalFormValues = z.infer<typeof goalSchema>;

export function GoalDialog({
  open,
  onOpenChange,
  goal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Partial<Goal> | null;
  onSave: (values: GoalFormValues) => void;
}) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name || "",
      targetAmount: goal?.targetAmount || 0,
      targetDate: goal?.targetDate || new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    form.reset({
      name: goal?.name || "",
      targetAmount: goal?.targetAmount || 0,
      targetDate: goal?.targetDate || new Date().toISOString().slice(0, 10),
    });
  }, [goal, form]);

  const handleSave = (values: GoalFormValues) => {
    onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {goal?.id ? "Edit" : "Add"} Goal
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Goal Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Target Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Target Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-white/20 border-0 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-indigo-400 dark:[color-scheme:dark]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-0 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Are you sure?</DialogTitle>
          <DialogDescription className="text-gray-300">
            This action cannot be undone. This will permanently delete the item.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-300 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
