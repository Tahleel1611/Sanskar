import { useState, useEffect } from "react";
import { ArrowRight, CircleHelp, ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ONBOARDING_DONE_KEY } from "@/lib/onboarding";
import { saveUserProfile, saveUserPreferences } from "@/lib/userStorage";
import { expandedQuestions, ecoCopletionTips } from "@/lib/mockData";

const Questionnaire = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionTip, setCompletionTip] = useState("");
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(true);

  const handleNameInput = () => {
    if (!userName.trim()) {
      toast({ title: "Name required", description: "Please enter your name to continue." });
      return;
    }
    saveUserProfile(userName);
    toast({ title: "Welcome!", description: `Hi ${userName}, let's personalize your experience.` });
    setShowNameModal(false);
  };

  useEffect(() => {
    if (showCompletion) {
      const timer = setTimeout(() => {
        localStorage.setItem(ONBOARDING_DONE_KEY, "true");
        toast({ title: "Welcome back!", description: "Ready to start your eco-journey!" });
        navigate("/", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCompletion, navigate, toast]);

  const current = expandedQuestions[step];

  const selectAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const handleNext = () => {
    if (!answers[current.id]) return;

    if (step === expandedQuestions.length - 1) {
      // Save preferences
      saveUserPreferences(answers);
      // Show completion
      const randomTip = ecoCopletionTips[Math.floor(Math.random() * ecoCopletionTips.length)];
      setCompletionTip(randomTip);
      setShowCompletion(true);
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const progressPercent = ((step + 1) / expandedQuestions.length) * 100;

  if (showNameModal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <div className="px-5 w-full max-w-md">
          <div className="rounded-xl bg-card shadow-card p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Welcome to Sanskar! 🌱</h2>
            <p className="text-sm text-muted-foreground">Before we get started, what's your name?</p>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg bg-muted border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameInput();
              }}
            />
            <Button className="w-full" onClick={handleNameInput}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Header />
        <div className="px-5 w-full max-w-md">
          <div className="rounded-xl bg-card shadow-card p-6 space-y-4 text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-foreground">Awesome!</h2>
            <p className="text-sm text-muted-foreground">You've completed your eco-profile. Here's a personalized tip:</p>
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
              <p className="text-sm text-foreground">{completionTip}</p>
            </div>
            <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="px-5 space-y-4 lg:max-w-2xl lg:mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Personalization Quiz</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Question {step + 1} of {expandedQuestions.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{Math.round(progressPercent)}% complete</p>
        </div>

        <div className="rounded-xl bg-card shadow-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CircleHelp className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider">Question {step + 1}</p>
          </div>
          <p className="text-lg font-semibold text-foreground">{current.title}</p>

          <div className="space-y-2">
            {current.options.map((option) => {
              const isActive = answers[current.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectAnswer(option)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "border-border bg-muted text-foreground hover:border-primary/30"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={handlePrevious}
              disabled={step === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1 h-10"
              onClick={handleNext}
              disabled={!answers[current.id]}
            >
              {step === expandedQuestions.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Answer Summary */}
        {Object.keys(answers).length > 0 && (
          <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Your Answers</p>
            <div className="space-y-1 text-xs">
              {expandedQuestions.slice(0, step + 1).map((q) => (
                <p key={q.id} className="text-muted-foreground">
                  <span className="text-foreground font-medium">Q{expandedQuestions.indexOf(q) + 1}:</span> {answers[q.id]}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;
