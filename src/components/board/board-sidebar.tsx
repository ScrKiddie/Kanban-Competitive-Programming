import { Board } from "@/lib/types";
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DEFAULT_BOARD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BoardSidebarProps {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onAddBoard: () => void;
  onEditBoard?: (boardId: string) => void;
  onDeleteBoard?: (boardId: string) => void;
  className?: string;
}

export function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  onAddBoard,
  onEditBoard,
  onDeleteBoard,
  className,
}: BoardSidebarProps) {
  const [boardSearch, setBoardSearch] = useState("");
  const debouncedBoardSearch = useDebouncedValue(boardSearch, 250);
  const isBoardSearchPending = boardSearch !== debouncedBoardSearch;
  const visibleBoards = boards.length > 0 ? boards : [DEFAULT_BOARD];
  const filteredBoards = useMemo(() => {
    const query = debouncedBoardSearch.trim().toLowerCase();

    if (!query) {
      return visibleBoards;
    }

    return visibleBoards.filter((board) => board.name.toLowerCase().includes(query));
  }, [debouncedBoardSearch, visibleBoards]);

  return (
    <Sidebar collapsible="offcanvas" className={cn("border-r-2 border-border bg-secondary-background", className)}>
      <SidebarHeader className="flex-row gap-2 border-b-2 border-border p-2 group-data-[collapsible=icon]:hidden">
        <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-base border-2 border-border bg-background px-2 text-sm group-data-[collapsible=icon]:hidden">
          <Search className="size-4 shrink-0 text-foreground/70" />
          <Input
            value={boardSearch}
            onChange={(event) => setBoardSearch(event.target.value)}
            placeholder="search boards"
            className="h-7 min-h-0 w-full min-w-0 border-0 bg-transparent px-0 py-0 text-sm leading-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={onAddBoard}
              className="size-8 shrink-0 justify-center p-0 bg-main text-main-foreground hover:bg-main/90 border-border"
            >
              <Plus className="size-4" />
              <span className="sr-only">New Board</span>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={2}>
            New Board
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarContent className="min-h-0 overflow-hidden px-0 py-0 group-data-[collapsible=icon]:p-0">
        <div className="relative min-h-0 flex-1">
        <ScrollArea className="h-full [&_[data-slot=scroll-area-scrollbar]]:right-0 [&_[data-slot=scroll-area-scrollbar]]:w-2.25 [&_[data-slot=scroll-area-thumb]]:rounded-full [&_[data-slot=scroll-area-thumb]]:bg-foreground">
          <SidebarGroup className="min-w-0 pl-2 pr-2 group-data-[collapsible=icon]:p-2">
            <SidebarGroupContent className="group-data-[collapsible=icon]:mt-0 min-w-0">
                <SidebarMenu className="gap-2 min-w-0">
                  {filteredBoards.map((board) => {
                    const boardInitial = board.name.trim().charAt(0).toUpperCase() || "?";

                    return (
                    <SidebarMenuItem key={board.id} className="min-w-0">
                      <div className="group/board-item relative min-w-0">
                        <SidebarMenuButton
                          isActive={activeBoardId === board.id}
                          onClick={() => onSelectBoard(board.id)}
                          tooltip={board.name}
                          className={cn(
                            "box-border min-w-0 max-w-full overflow-hidden font-medium pr-9 md:group-hover/board-item:bg-main md:group-hover/board-item:text-main-foreground md:group-hover/board-item:border-border group-focus-within/board-item:bg-main group-focus-within/board-item:text-main-foreground group-focus-within/board-item:border-border group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center",
                            activeBoardId === board.id && "bg-main text-main-foreground border-border",
                          )}
                        >
                          <span className="hidden text-sm font-heading uppercase group-data-[collapsible=icon]:block">
                            {boardInitial}
                          </span>
                          <span className="block w-0 min-w-0 flex-1 basis-0 truncate group-data-[collapsible=icon]:hidden">{board.name}</span>
                        </SidebarMenuButton>

                        <div className={cn(
                          "absolute top-1/2 right-1 z-10 -translate-y-1/2 group-data-[collapsible=icon]:hidden"
                        )}>
                          <Menubar className={cn(
                            "h-7 border-none bg-transparent p-0"
                          )}>
                            <MenubarMenu>
                            <MenubarTrigger className={cn(
                              "h-6 w-6 cursor-pointer border-2 border-transparent p-0 flex items-center justify-center text-inherit shadow-none bg-transparent rounded-base outline-none focus:border-transparent focus-visible:border-transparent hover:border-transparent data-[state=open]:border-transparent md:group-hover/board-item:text-main-foreground group-focus-within/board-item:text-main-foreground",
                              activeBoardId === board.id && "text-main-foreground"
                            )}

                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </MenubarTrigger>
                            <MenubarContent align="end">
                              <MenubarItem onClick={() => onEditBoard?.(board.id)}>
                                edit board
                              </MenubarItem>
                              <MenubarItem onClick={() => onDeleteBoard?.(board.id)} className="text-destructive focus:text-destructive">
                                delete board
                              </MenubarItem>
                            </MenubarContent>
                          </MenubarMenu>
                          </Menubar>
                        </div>
                      </div>
                    </SidebarMenuItem>
                    );
                  })}
                  {filteredBoards.length === 0 && (
                    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                      <p className="px-2 pb-4 pt-2 text-center text-sm text-muted-foreground">
                        No boards found
                      </p>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
          {isBoardSearchPending ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-base bg-secondary-background/75 text-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              <span className="sr-only">Searching boards</span>
            </div>
          ) : null}
        </div>
        </SidebarContent>
        <SidebarRail />
    </Sidebar>
  );
}
