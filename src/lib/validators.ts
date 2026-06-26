export function validateTitle(title: string) {
  if (!title.trim()) {
    return "title is required";
  }

  return "";
}

export function validateBoardName(name: string) {
  if (!name.trim()) {
    return "board name is required";
  }
  
  if (name.length > 50) {
    return "board name must be under 50 characters";
  }

  return "";
}
