import { useCallback, useState } from "react";
import {
  OnboardingState,
  loadOnboardingState,
  saveOnboardingState,
} from "@/lib/onboarding";

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => loadOnboardingState());
  const [welcomeOpen, setWelcomeOpen] = useState(() => !loadOnboardingState().hasSeenWelcome);
  const [guideOpen, setGuideOpen] = useState(false);

  const markWelcomeSeen = useCallback(() => {
    setState((current) => {
      const nextState = { ...current, hasSeenWelcome: true };
      saveOnboardingState(nextState);
      return nextState;
    });
    setWelcomeOpen(false);
  }, []);

  const openGuide = useCallback(() => {
    setGuideOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
  }, []);

  return {
    loaded: true,
    hasSeenWelcome: state.hasSeenWelcome,
    welcomeOpen,
    guideOpen,
    setWelcomeOpen,
    setGuideOpen,
    markWelcomeSeen,
    openGuide,
    closeGuide,
  };
}
