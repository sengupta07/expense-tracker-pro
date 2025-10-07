"use client";

import { MotionSection } from "@/components/MotionSection";
import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center p-4">
      <MotionSection className="w-full max-w-3xl">
        <Card className="glassmorphism text-white border-0">
          <CardContent className="p-6 md:p-8">{children}</CardContent>
        </Card>
      </MotionSection>
    </div>
  );
}
