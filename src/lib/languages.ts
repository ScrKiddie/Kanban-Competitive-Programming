export const programmingLanguages = [
  { value: "python", label: "Python", extension: "py" },
  { value: "javascript", label: "JavaScript", extension: "js" },
  { value: "typescript", label: "TypeScript", extension: "ts" },
  { value: "go", label: "Go", extension: "go" },
  { value: "java", label: "Java", extension: "java" },
  { value: "cpp", label: "C++", extension: "cpp" },
  { value: "c", label: "C", extension: "c" },
  { value: "csharp", label: "C#", extension: "cs" },
  { value: "rust", label: "Rust", extension: "rs" },
  { value: "ruby", label: "Ruby", extension: "rb" },
  { value: "php", label: "PHP", extension: "php" },
  { value: "swift", label: "Swift", extension: "swift" },
  { value: "kotlin", label: "Kotlin", extension: "kt" },
  { value: "dart", label: "Dart", extension: "dart" },
  { value: "sql", label: "SQL", extension: "sql" },
  { value: "bash", label: "Bash", extension: "sh" },
] as const;

export type ProgrammingLanguage = (typeof programmingLanguages)[number]["value"];

export function getLanguageExtension(languageValue: string): string {
  const lang = programmingLanguages.find((l) => l.value === languageValue);
  return lang?.extension || "txt";
}
