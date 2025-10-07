"use client";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, Loader2, AlertTriangle } from "lucide-react";

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.email, values.password);
      router.push(next);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "An unknown error occurred during login.";
      setError(message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism p-8 rounded-2xl max-w-sm w-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-8 w-8 text-indigo-400" />
          <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        </div>
        <p className="text-sm text-gray-300 mb-6">
          Log in to continue to your dashboard.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="bg-white/10 border-0 text-white placeholder:text-gray-400 pl-10 focus:bg-white/20"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="bg-white/10 border-0 text-white placeholder:text-gray-400 pl-10 focus:bg-white/20"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-sm mt-6 text-center text-gray-300">
          No account?{" "}
          <Link
            className="font-semibold text-indigo-400 hover:underline"
            href="/signup"
          >
            Sign up here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 text-indigo-40-0 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
