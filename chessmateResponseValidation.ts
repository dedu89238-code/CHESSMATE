/**
 * Response completeness validator for CHESSMATE
 * Ensures no truncated, cut-off, or incomplete sentences/thoughts are ever rendered.
 */

// Trailing words or phrases that signify an incomplete sentence, even if ending with a period or dash
const DANGLING_ENDINGS = [
  /\b(of the|in the|on the|at the|to the|from the|with the|for the|by the|and the|or the|is the|that the|as the)\s*[.,;:!?-]?$/i,
  /\b(control of|giving up|because of|due to|such as|instead of|in front of|on top of)\s*[.,;:!?-]?$/i,
  /\b(and|or|but|because|since|unless|until|although|though)\s*[.,;:!?-]?$/i,
  /\b(the|a|an)\s*[.,;:!?-]?$/i,
  /\b(of|with|into|onto|upon|towards)\s*[.,;:!?-]?$/i,
];

// Recognized valid terminal characters: standard punctuation, quotes, brackets, variation selectors, or emojis
const TERMINAL_CHAR_REGEX = /[.!?:*)"'\]\u2600-\u26FF\uFE00-\uFE0F\u{1F300}-\u{1FAFF}]$/u;

export function isResponseTextComplete(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 5) return false;

  // 1. Check for dangling trailing phrases
  for (const pattern of DANGLING_ENDINGS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // 2. Must end with proper terminal punctuation or emoji
  if (!TERMINAL_CHAR_REGEX.test(trimmed)) {
    return false;
  }

  // 3. Check for balanced markdown code blocks
  const codeBlocks = trimmed.match(/```/g);
  if (codeBlocks && codeBlocks.length % 2 !== 0) {
    return false;
  }

  // 4. Check for unbalanced markdown bold markers
  const boldMarkers = trimmed.match(/\*\*/g);
  if (boldMarkers && boldMarkers.length % 2 !== 0) {
    return false;
  }

  // 5. Check for unclosed parentheses or brackets
  let openParen = 0;
  let openBracket = 0;
  for (const ch of trimmed) {
    if (ch === '(') openParen++;
    else if (ch === ')') openParen = Math.max(0, openParen - 1);
    else if (ch === '[') openBracket++;
    else if (ch === ']') openBracket = Math.max(0, openBracket - 1);
  }
  if (openParen > 0 || openBracket > 0) {
    return false;
  }

  return true;
}
