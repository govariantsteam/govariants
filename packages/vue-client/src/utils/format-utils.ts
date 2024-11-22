export function toUpperCaseFirstLetter(string: string) {
  if (string.length === 0) {
    return "";
  }

  return string[0].toUpperCase() + string.slice(1);
}
