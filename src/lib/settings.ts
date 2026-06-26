import { Store } from "@tauri-apps/plugin-store";
import type { AppSettings } from "@/lib/types";

const SETTINGS_FILE = "settings.json";

let storeInstance: Store | null = null;

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: "openai-compatible",
  aiApiKey: "",
  aiModel: "gpt-4o-mini",
  aiBaseUrl: "https://api.openai.com/v1",
  openRouterSiteUrl: "",
  openRouterAppName: "KanbanCP",
  githubRepoUrl: "",
  githubToken: "",
};

async function getStore() {
  if (!storeInstance) {
    storeInstance = await Store.load(SETTINGS_FILE);
  }
  return storeInstance;
}

export async function getSettings(): Promise<AppSettings> {
  const store = await getStore();
  const entries = await store.entries();
  return entries.reduce<AppSettings>((settings, [key, value]) => {
    if (key in settings && typeof value === "string") {
      return { ...settings, [key]: value };
    }
    return settings;
  }, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings) {
  const store = await getStore();
  for (const [key, value] of Object.entries(settings)) {
    await store.set(key, value);
  }
  await store.save();
}
