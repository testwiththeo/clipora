"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProcessingCardProps {
  title: string;
  step: number; // 0 = importing, 1 = transcribing, 2 = analyzing
}

const steps = [
  { label: "Importing metadata", hint: "Fetching video info from YouTube" },
  { label: "Transcribing audio", hint: "Usually takes 1–2 minutes" },
  { label: "Finding best moments", hint: "Analyzing transcript for clips" },
];

export function ProcessingCard({ title, step }: ProcessingCardProps) {
  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto mt-16"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processing: {title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steps */}
          <div className="space-y-3">
            {steps.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;

              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Check size={16} className="text-success" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDone ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-muted-foreground">{s.hint}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1.5" />
        </CardContent>
      </Card>
    </motion.div>
  );
}
