import { useEffect, useState } from "react";
import { Info, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "@/lib/settings";
import type { AIProvider, AppSettings } from "@/lib/types";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [repos, setRepos] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const loadRepos = async (token: string) => {
    if (!token.trim()) {
      setRepos([]);
      return;
    }
    setLoadingRepos(true);
    try {
      const response = await tauriFetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${token.trim()}`,
          "User-Agent": "KanbanCP-Client",
        },
      });

      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errData = await response.json() as { message?: string };
          if (errData && errData.message) {
            errorDetails = errData.message;
          }
        } catch {}
        throw new Error(`GitHub API error (${response.status}): ${errorDetails}`);
      }

      const data = await response.json() as Array<{ full_name: string; html_url: string }>;
      if (Array.isArray(data)) {
        const urls = data.map((repo) => repo.html_url);
        setRepos(urls);
        toast.success("Token verified and repositories loaded successfully!");
      } else {
        throw new Error("Invalid response format from GitHub");
      }
    } catch (error) {
      console.error("Failed to fetch GitHub repos", error);
      const errMsg = error instanceof Error ? error.message : "Failed to load repositories";
      toast.error(errMsg);
      setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void getSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
      if (loadedSettings.githubToken.trim()) {
        void loadRepos(loadedSettings.githubToken);
      }
    });
  }, [open]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      toast.success("Settings saved locally");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      className="h-[85vh] sm:max-w-2xl"
      contentClassName="flex flex-col overflow-hidden"
      scrollable={false}
    >
      <ScrollArea className="min-h-0 flex-1 bg-background" viewportClassName="[&>div]:!block">
        <div className="grid gap-5 px-6 py-5">
          <Alert className="bg-yellow-400 text-black border-border">
            <Info className="size-4" />
            <AlertTitle>Local-only keys</AlertTitle>
            <AlertDescription>
              Keys are stored locally on this desktop only. KanbanCP does not use a hosted backend for AI keys.
            </AlertDescription>
          </Alert>

          <section className="grid gap-3 rounded-base border-2 border-border bg-secondary-background p-4">
            <h3 className="font-heading text-sm uppercase tracking-wide">BYOK AI</h3>
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Select value={settings.aiProvider} onValueChange={(value) => update("aiProvider", value as AIProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai-compatible">OpenAI Compatible</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Base URL</Label>
              <Input value={settings.aiBaseUrl} onChange={(event) => update("aiBaseUrl", event.target.value)} placeholder="https://api.openai.com/v1" />
            </div>
            <div className="grid gap-2">
              <Label>Model</Label>
              <Input value={settings.aiModel} onChange={(event) => update("aiModel", event.target.value)} placeholder="gpt-4o-mini" />
            </div>
            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input type="password" value={settings.aiApiKey} onChange={(event) => update("aiApiKey", event.target.value)} placeholder="sk-..." />
            </div>
          </section>

          <Alert className="bg-yellow-400 text-black border-border">
            <Info className="size-4" />
            <AlertTitle>GitHub Sync Info</AlertTitle>
            <AlertDescription>
              <p>
                KanbanCP saves solution files to the selected repository using this path:{" "}
                <code className="font-mono text-sm">[platform]/[problem-slug].[ext]</code>
              </p>
              <p>
                Sync only runs when you click the GitHub icon on a problem card.
              </p>
            </AlertDescription>
          </Alert>

          <section className="grid gap-3 rounded-base border-2 border-border bg-secondary-background p-4">
            <h3 className="font-heading text-sm uppercase tracking-wide">GitHub PAT</h3>
            <div className="grid gap-2">
              <Label>Personal Access Token</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={settings.githubToken}
                  onChange={(event) => update("githubToken", event.target.value)}
                  placeholder="ghp_..."
                  className="flex-1"
                />
                <IconButton
                  type="button"
                  size="xl"
                  onClick={() => void loadRepos(settings.githubToken)}
                  disabled={loadingRepos || !settings.githubToken.trim()}
                  tooltip="Check Token"
                  className="shrink-0"
                >
                  {loadingRepos ? <Loader2 className="animate-spin" /> : <Check />}
                </IconButton>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Repository</Label>
              <Select
                value={settings.githubRepoUrl}
                onValueChange={(value) => update("githubRepoUrl", value)}
                disabled={!settings.githubToken.trim() || repos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!settings.githubToken.trim() ? "Enter token & check first" : repos.length === 0 ? "No repositories loaded" : "Select a repository"} />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((url) => (
                    <SelectItem key={url} value={url}>
                      {new URL(url).pathname.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t-2 border-border bg-background p-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="neutral" onClick={() => onOpenChange(false)} disabled={saving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
