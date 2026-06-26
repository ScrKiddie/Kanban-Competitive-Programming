import { BookOpen, PanelLeft, Plus, Search, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { Board, Difficulty, Platform, SaveState, difficulties, platforms } from "@/lib/types";
import { useSidebar } from "@/components/ui/sidebar";

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  platformFilter: Platform | "all";
  onPlatformChange: (value: Platform | "all") => void;
  difficultyFilter: Difficulty | "all";
  onDifficultyChange: (value: Difficulty | "all") => void;
  saveState: SaveState;
  saveMessage: string;
  onAdd: () => void;
  board: Board;
  onEditBoard: () => void;
  onDeleteBoard: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
}

export function TopBar(props: TopBarProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="rounded-base border-2 border-border bg-secondary-background p-3 text-foreground shadow-shadow md:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-5">
        <div className="flex items-center gap-3 xl:w-[400px] xl:shrink-0">
          <IconButton size="xl" onClick={toggleSidebar} tooltip="Toggle Sidebar">
            <PanelLeft />
          </IconButton>
          <IconButton size="xl" onClick={props.onAdd} tooltip="Add Problem">
            <Plus />
          </IconButton>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-base border-2 border-border bg-background px-4">
            <Search className="size-4 shrink-0 text-foreground/70" />
            <Input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="search by title" className="min-h-0 w-full min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
          </label>
        </div>

        <div className="flex flex-col gap-3 xl:flex-1 xl:flex-row xl:items-center xl:justify-end xl:gap-2">
          <div className="flex w-full gap-2 min-w-0 xl:w-auto xl:flex-none">
            <div className="min-w-0 flex-1 xl:w-[140px] xl:flex-none">
              <Select value={props.platformFilter} onValueChange={(value) => props.onPlatformChange(value as Platform | "all")}>
                <SelectTrigger className="h-10 text-sm w-full px-2 sm:px-3">
                  <SelectValue placeholder="platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all sources</SelectItem>
                  {platforms.map((platform) => <SelectItem key={platform} value={platform}>{PLATFORM_LABELS[platform]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-1 xl:w-[130px] xl:flex-none">
              <Select value={props.difficultyFilter} onValueChange={(value) => props.onDifficultyChange(value as Difficulty | "all")}>
                <SelectTrigger className="h-10 text-sm w-full px-2 sm:px-3">
                  <SelectValue placeholder="all levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all levels</SelectItem>
                  {difficulties.map((difficulty) => <SelectItem key={difficulty} value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 xl:w-auto xl:shrink-0 xl:flex-nowrap">
            <ThemeToggle />
            <IconButton size="xl" onClick={props.onOpenSettings} tooltip="Settings">
              <Settings />
            </IconButton>
            <IconButton size="xl" onClick={props.onOpenGuide} tooltip="Quick Guide">
              <BookOpen />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  );
}
