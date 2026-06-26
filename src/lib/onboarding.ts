export const ONBOARDING_STORAGE_KEY = "brickcp.onboarding.v1";

export type OnboardingState = {
  hasSeenWelcome: boolean;
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  hasSeenWelcome: false,
};

export type QuickGuideStep = {
  id: string;
  title: string;
  description: string;
};

export const QUICK_GUIDE_STEPS: QuickGuideStep[] = [
  {
    id: "boards",
    title: "Organize with boards",
    description: "Start with any board, then create extra boards for topics, contests, or learning goals.",
  },
  {
    id: "problems",
    title: "Add coding problems",
    description: "Save problems one by one or in bulk, then keep the URL, notes, difficulty, and platform in one place.",
  },
  {
    id: "workflow",
    title: "Move through the workflow",
    description: "Drag cards from Backlog to Today, Review, and Done so your practice progress stays visible.",
  },
  {
    id: "solutions",
    title: "Store solutions and reviews",
    description: "Add solution code, request AI review when configured, and keep improvements attached to each problem.",
  },
  {
    id: "sync",
    title: "Optional GitHub sync",
    description: "Configure GitHub in Settings when you want to export completed work to your repository.",
  },
];

export function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") {
    return DEFAULT_ONBOARDING_STATE;
  }

  const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_ONBOARDING_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...DEFAULT_ONBOARDING_STATE,
      hasSeenWelcome: parsed.hasSeenWelcome === true,
    };
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function saveOnboardingState(state: OnboardingState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}
