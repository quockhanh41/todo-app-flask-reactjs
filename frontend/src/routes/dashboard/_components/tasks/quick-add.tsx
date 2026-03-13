import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateTaskMutation } from "@/services/mutations/tasks";
import { useGetTagsQuery } from "@/services/queries/tags";
import { parseQuickAddText } from "@/lib/quick-add-parser";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { LoaderCircle, Lightbulb } from "lucide-react";

function formatDeadlineLabel(deadline: string, referenceDate = new Date()): string {
  const deadlineDate = new Date(deadline);
  const timeLabel = deadlineDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const startOfReference = new Date(referenceDate);
  startOfReference.setHours(0, 0, 0, 0);

  const startOfDeadline = new Date(deadlineDate);
  startOfDeadline.setHours(0, 0, 0, 0);

  const dateLabel = deadlineDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return `${timeLabel} ${dateLabel}`;
}

export const QuickAdd = () => {
  const [inputVal, setInputVal] = useState("");
  const [deadlineDecision, setDeadlineDecision] = useState<"accepted" | "dismissed" | null>(null);
  const { data: tags = [] } = useGetTagsQuery();
  const { token } = useAuthStore();
  const mutation = useCreateTaskMutation();

  const [openSuggest, setOpenSuggest] = useState(false);
  const [suggestType, setSuggestType] = useState<"TAG" | "DATE" | "PRIORITY" | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedResult = parseQuickAddText(inputVal, tags);
  const requiresDeadlineConfirmation =
    parsedResult.deadlineConfidence === "MEDIUM" &&
    parsedResult.deadline !== null &&
    deadlineDecision === null;
  const effectiveDeadline =
    parsedResult.deadline &&
    (parsedResult.deadlineConfidence === "HIGH" || deadlineDecision === "accepted")
      ? parsedResult.deadline
      : undefined;
  const showDeadlineBadge = Boolean(effectiveDeadline);
  const showDeadlineSuggestion =
    parsedResult.deadline &&
    parsedResult.deadlineConfidence === "MEDIUM" &&
    deadlineDecision !== "dismissed";
  const effectiveDeadlineLabel = effectiveDeadline ? formatDeadlineLabel(effectiveDeadline) : null;
  const suggestedDeadlineLabel = parsedResult.deadline
    ? formatDeadlineLabel(parsedResult.deadline)
    : null;

  useEffect(() => {
    const words = inputVal.split(" ");
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("/") || lastWord.startsWith("#")) {
      setSuggestType("TAG");
      setFilterQuery(lastWord.slice(1).toLowerCase());
      setOpenSuggest(true);
    } else if (lastWord.startsWith("@")) {
      setSuggestType("DATE");
      setFilterQuery(lastWord.toLowerCase());
      setOpenSuggest(true);
    } else if (lastWord.startsWith("!")) {
      setSuggestType("PRIORITY");
      setFilterQuery(lastWord.toLowerCase());
      setOpenSuggest(true);
    } else {
      setOpenSuggest(false);
      setSuggestType(null);
      setFilterQuery("");
    }
  }, [inputVal]);

  useEffect(() => {
    setDeadlineDecision(null);
  }, [inputVal]);

  const replaceLastWord = (replacement: string) => {
    const words = inputVal.split(" ");
    words[words.length - 1] = replacement;
    let newText = words.join(" ") + " ";

    // Automatically suggest next step if we just finished one
    if (suggestType === "TAG") {
        newText += "@";
    } else if (suggestType === "DATE") {
        newText += "!";
    }

    setInputVal(newText);
    setOpenSuggest(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && openSuggest) {
      e.preventDefault();
      // Make Tab behave like Down Arrow, and Shift+Tab like Up Arrow
      const event = new window.KeyboardEvent("keydown", {
        key: e.shiftKey ? "ArrowUp" : "ArrowDown",
        bubbles: true,
        cancelable: true,
      });
      inputRef.current?.dispatchEvent(event);
    } else if (e.key === "Enter" && !openSuggest) {
      e.preventDefault();
      if (!parsedResult.title.trim()) return;
      if (requiresDeadlineConfirmation) {
        toast.message("Confirm or dismiss the suggested deadline before creating the task");
        return;
      }

      try {
        await mutation.mutateAsync({
          token,
          formData: {
            title: parsedResult.title.trim(),
            content: parsedResult.title.trim(),
            tagId: parsedResult.tagId || tags[0]?.id.toString() || "",
            status: "PENDING",
            priority: parsedResult.priority || "MEDIUM",
            deadline: effectiveDeadline,
          },
        });
        toast.success("Task created via Quick Add!");
        setInputVal("");
      } catch (error) {
        toast.error("Failed to create task");
      }
    } else if (e.key === "Enter" && openSuggest) {
      e.preventDefault();
      const selectedEl = document.querySelector('[cmdk-item][data-selected="true"]') as HTMLElement;
      if (selectedEl) {
        selectedEl.click();
      }
    }
  };

  const dateSuggestions = ["@today", "@tomorrow", "@nextweek", "@14:30", "@18:00"];
  const prioritySuggestions = ["!high", "!medium", "!low"];

  const filteredTags = tags.filter((t) => t.name.toLowerCase().includes(filterQuery));
  const filteredDates = dateSuggestions.filter((d) => d.toLowerCase().includes(filterQuery));
  const filteredPriorities = prioritySuggestions.filter((p) => p.toLowerCase().includes(filterQuery));

  return (
    <div className="w-full relative mb-6">
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground ml-1">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <span>
          <strong>Pro tip:</strong> Type <code className="bg-muted px-1 rounded">/</code> or <code className="bg-muted px-1 rounded">#</code> for Tags, <code className="bg-muted px-1 rounded">@</code> for Deadline, <code className="bg-muted px-1 rounded">!</code> for Priority, or write naturally like "Học tiếng Anh lúc 8h tối mai".
        </span>
      </div>

      <Command shouldFilter={false} loop className="bg-transparent overflow-visible">
        <Popover open={openSuggest && suggestType !== null && (filteredTags.length > 0 || filteredDates.length > 0 || filteredPriorities.length > 0)} onOpenChange={(open) => { if (!open) setOpenSuggest(false); }}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Học tiếng Anh lúc 8h tối mai /study !high"
                className="pr-24 shadow-sm"
                disabled={mutation.isPending}
              />
              {mutation.isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoaderCircle className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-full left-0 mt-1 flex flex-wrap gap-1 z-10">
                 {parsedResult.priority && (
                   <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700">
                      Priority: {parsedResult.priority}
                   </Badge>
                 )}
                 {parsedResult.tagId && (
                   <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                      Tag: {tags.find(t => t.id.toString() === parsedResult.tagId)?.name}
                   </Badge>
                 )}
                 {showDeadlineBadge && effectiveDeadline && (
                   <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700">
                      Due: {effectiveDeadlineLabel}
                   </Badge>
                 )}
                 {showDeadlineSuggestion && parsedResult.deadline && suggestedDeadlineLabel && (
                   <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 shadow-sm">
                      <span>
                        Đặt lịch {suggestedDeadlineLabel}?
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setDeadlineDecision("accepted")}
                      >
                        Dùng
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-amber-700 hover:text-amber-900"
                        onClick={() => setDeadlineDecision("dismissed")}
                      >
                        Bỏ qua
                      </Button>
                   </div>
                 )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[200px] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <CommandList>
              <CommandGroup heading={suggestType === "TAG" ? "🏷️ Select Tag" : suggestType === "DATE" ? "📅 Select Date/Time" : suggestType === "PRIORITY" ? "⚡ Select Priority" : ""}>
                {suggestType === "TAG" && filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => replaceLastWord(`#${tag.name}`)}
                  >
                    {tag.name}
                  </CommandItem>
                ))}
                
                {suggestType === "DATE" && filteredDates.map((d) => (
                  <CommandItem key={d} value={d} onSelect={() => replaceLastWord(d)}>
                    {d}
                  </CommandItem>
                ))}

                {suggestType === "PRIORITY" && filteredPriorities.map((p) => (
                  <CommandItem key={p} value={p} onSelect={() => replaceLastWord(p)}>
                    {p.replace("!", "").toUpperCase()}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>
    </div>
  );
};
