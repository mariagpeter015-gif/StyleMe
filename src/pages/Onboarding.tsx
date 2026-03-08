import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Shirt } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "What's your skin tone?",
    field: "skin_tone",
    multiSelect: false,
    options: ["Fair", "Light", "Medium", "Olive", "Brown", "Dark"],
  },
  {
    title: "What's your style?",
    field: "style_preference",
    multiSelect: true,
    options: ["Minimalist", "Casual", "Formal", "Streetwear", "Bohemian", "Ethnic", "Sporty"],
  },
  {
    title: "How would you describe your personality?",
    field: "personality",
    multiSelect: true,
    options: ["Professional", "Creative", "Adventurous", "Elegant", "Playful", "Laid-back"],
  },
  {
    title: "What's your body type?",
    field: "body_type",
    multiSelect: false,
    options: ["Petite", "Tall", "Athletic", "Curvy", "Slim", "Plus-size"],
  },
];

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleSelect = (value: string) => {
    if (step.multiSelect) {
      const current = (selections[step.field] as string[]) ?? [];
      if (current.includes(value)) {
        setSelections((prev) => ({
          ...prev,
          [step.field]: current.filter((v) => v !== value),
        }));
      } else {
        setSelections((prev) => ({
          ...prev,
          [step.field]: [...current, value],
        }));
      }
    } else {
      setSelections((prev) => ({ ...prev, [step.field]: value }));
    }
  };

  const isSelected = (value: string) => {
    const current = selections[step.field];
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  };

  const hasSelection = () => {
    const current = selections[step.field];
    if (Array.isArray(current)) return current.length > 0;
    return !!current;
  };

  const handleNext = async () => {
    if (!hasSelection()) {
      setError("Please select at least one option to continue.");
      return;
    }
    setError(null);

    if (isLastStep) {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const payload = {
          user_id: user?.id,
          skin_tone: selections.skin_tone as string,
          style_preference: Array.isArray(selections.style_preference)
            ? (selections.style_preference as string[]).join(", ")
            : selections.style_preference as string,
          personality: Array.isArray(selections.personality)
            ? (selections.personality as string[]).join(", ")
            : selections.personality as string,
          body_type: selections.body_type as string,
        };
        const { error: insertError } = await (supabase as any).from("profiles").insert(payload);
        if (insertError) throw insertError;
        onComplete();
      } catch (err) {
        console.error(err);
        setError("Failed to save your preferences. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shirt className="h-7 w-7 text-primary" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h1 className="text-2xl font-bold text-foreground">{step.title}</h1>
          {step.multiSelect && (
            <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
          )}
        </div>

        <div className="mb-8 h-1.5 w-full rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          {step.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`rounded-2xl px-5 py-3 text-sm font-medium transition-all ${
                isSelected(option)
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleNext}
          disabled={loading}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : isLastStep ? (
            "Get Started 🎉"
          ) : (
            "Next →"
          )}
        </Button>

        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;