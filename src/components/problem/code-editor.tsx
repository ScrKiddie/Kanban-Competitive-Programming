"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { programmingLanguages } from "@/lib/languages";
import { IconButton } from "@/components/ui/icon-button";

interface SolutionCodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string, language: string) => void;
  className?: string;
  readOnly?: boolean;
}

export function SolutionCodeEditor({ code, language, onChange, className = "", readOnly = false }: SolutionCodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (value: string) => {
    onChange(code, value);
  };

  const handleCodeChange = (value: string | undefined) => {
    onChange(value || "", language);
  };

  const activeLanguage = language || "python";

  return (
    <div className={`flex flex-col gap-2 min-w-0 w-full h-full flex-1 ${className}`}>
      <div className="flex items-center justify-between shrink-0 p-1">
        <Select value={activeLanguage} onValueChange={handleLanguageChange} disabled={readOnly}>
          <SelectTrigger className="w-[140px] h-8 text-xs font-base">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            {programmingLanguages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className="text-xs">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <IconButton
          size="md"
          onClick={handleCopy}
          tooltip="Copy code"
          disabled={!code || !code.trim()}
        >
          {copied ? <Check /> : <Copy />}
        </IconButton>
      </div>

      <div className={`relative rounded-base border-2 border-border bg-[#1e1e1e] flex-1 flex flex-col min-h-[300px] overflow-hidden ${readOnly ? '[&_textarea]:hidden [&_.cursor]:hidden' : ''}`}>
        <Editor
          height="100%"
          language={activeLanguage}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          loading={
            <div className="flex h-full w-full flex-col bg-[#1e1e1e] p-6">
              <div className="h-4 w-1/3 rounded-sm bg-white/5 mb-3 animate-pulse" />
              <div className="h-4 w-1/2 rounded-sm bg-white/5 mb-3 animate-pulse" />
              <div className="h-4 w-1/4 rounded-sm bg-white/5 mb-3 animate-pulse" />
              <div className="h-4 w-2/5 rounded-sm bg-white/5 mb-3 animate-pulse" />
            </div>
          }
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            readOnly: readOnly,
            domReadOnly: readOnly,
            fontSize: 13,
            fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            renderLineHighlight: readOnly ? "none" : "all",
            hideCursorInOverviewRuler: readOnly,
            matchBrackets: readOnly ? "never" : "always",
            selectionHighlight: !readOnly,
            scrollbar: {
              vertical: "visible",
              horizontal: "hidden"
            }
          }}
        />
      </div>
    </div>
  );
}

