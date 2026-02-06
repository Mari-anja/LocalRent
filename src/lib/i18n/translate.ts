import type { LanguageCode } from "@/types";
import type { TranslateOptions, TranslationResult } from "./types";
import { getFlatDictionary } from "./dictionary";

// ─── Core Translation Function ───────────────────────────────────────────────

/**
 * Translate a real-estate listing string to English.
 *
 * Strategy:
 *  1. Normalize the input (lowercase, collapse whitespace).
 *  2. Run a greedy longest-match scan against our domain dictionary.
 *     Each matched term is replaced in-place with its English equivalent.
 *  3. Any remaining untranslated segments are collected.
 *  4. If `dictionaryOnly` is false (default), those segments would be sent
 *     to Google Translate. Right now the API call is stubbed — the segments
 *     are returned as-is so the caller can see what the dictionary missed.
 *
 * This two-pass approach gives us:
 *  - Speed: most real-estate jargon resolves locally in <1ms.
 *  - Accuracy: domain terms are hand-curated, not guessed by a generic model.
 *  - Cost: API calls only for novel free-text we haven't seen before.
 */
export async function translate(
  text: string,
  options: TranslateOptions
): Promise<TranslationResult> {
  const { from, to = "en", dictionaryOnly = false } = options;

  // Pass-through: already in target language or empty input.
  if (from === to || !text.trim()) {
    return {
      translated: text,
      original: text,
      sourceLanguage: from,
      method: "none",
      untranslatedSegments: [],
      dictionaryHits: 0,
    };
  }

  // ── Pass 1: Dictionary replacement ───────────────────────────────────────

  const { result, hits, gaps } = applyDictionary(text, from);

  // Dictionary covered everything — done.
  if (gaps.length === 0) {
    return {
      translated: result,
      original: text,
      sourceLanguage: from,
      method: "dictionary",
      untranslatedSegments: [],
      dictionaryHits: hits,
    };
  }

  // ── Pass 2: API fallback ─────────────────────────────────────────────────

  if (dictionaryOnly) {
    return {
      translated: result,
      original: text,
      sourceLanguage: from,
      method: hits > 0 ? "mixed" : "none",
      untranslatedSegments: gaps,
      dictionaryHits: hits,
    };
  }

  const apiTranslated = await translateViaApi(result, from, to, gaps);

  return {
    translated: apiTranslated,
    original: text,
    sourceLanguage: from,
    method: hits > 0 ? "mixed" : "api",
    untranslatedSegments: gaps,
    dictionaryHits: hits,
  };
}

// ─── Dictionary Engine ───────────────────────────────────────────────────────

interface DictionaryPassResult {
  /** Text with all matched terms replaced by English. */
  result: string;
  /** How many dictionary terms matched. */
  hits: number;
  /** Remaining non-whitespace segments the dictionary didn't cover. */
  gaps: string[];
}

/**
 * Greedy longest-match scan.
 *
 * We walk through the lowercased text left-to-right. At each position
 * we try every dictionary entry (longest first). On match we splice
 * in the English term and jump past it. Unmatched characters accumulate
 * as "gap" segments.
 */
function applyDictionary(
  text: string,
  lang: LanguageCode
): DictionaryPassResult {
  const entries = getFlatDictionary(lang);
  if (entries.length === 0) {
    return { result: text, hits: 0, gaps: [text.trim()] };
  }

  const lower = text.toLowerCase();
  const output: string[] = [];
  let hits = 0;
  let pos = 0;
  let currentGap = "";

  while (pos < lower.length) {
    let matched = false;

    for (const [term, en] of entries) {
      // Check if the term matches at the current position.
      if (!lower.startsWith(term, pos)) continue;

      // Ensure we're on a word boundary so "camera" doesn't match
      // inside "fotocamera".
      const before = pos > 0 ? lower[pos - 1] : " ";
      const after = pos + term.length < lower.length
        ? lower[pos + term.length]
        : " ";

      if (isWordChar(before) || isWordChar(after)) continue;

      // Flush any accumulated gap text.
      if (currentGap) {
        output.push(currentGap);
        currentGap = "";
      }

      output.push(en);
      hits++;
      pos += term.length;
      matched = true;
      break;
    }

    if (!matched) {
      currentGap += text[pos]; // preserve original casing for gaps
      pos++;
    }
  }

  if (currentGap) output.push(currentGap);

  // Collect non-trivial gaps (ignore whitespace / punctuation-only segments).
  const gaps = extractGaps(output, entries);

  return { result: output.join(""), hits, gaps };
}

/** Is the character a word-constituent (letter or digit)? */
function isWordChar(ch: string): boolean {
  return /\p{L}|\p{N}/u.test(ch);
}

/**
 * Walk the assembled output and collect segments that are NOT
 * English dictionary terms and contain at least one letter.
 */
function extractGaps(
  segments: string[],
  entries: ReadonlyArray<readonly [string, string]>
): string[] {
  const englishTerms = new Set(entries.map(([, en]) => en.toLowerCase()));
  const gaps: string[] = [];

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    // If this segment is one of our English translations, skip it.
    if (englishTerms.has(trimmed.toLowerCase())) continue;
    // Only count as a gap if it contains at least one letter.
    if (/\p{L}/u.test(trimmed)) {
      gaps.push(trimmed);
    }
  }

  return gaps;
}

// ─── Google Translate Stub ───────────────────────────────────────────────────

/**
 * Stub for the Google Translate API fallback.
 *
 * In production this will:
 *  1. Batch the untranslated gap segments into a single API call.
 *  2. Splice the API responses back into the full string.
 *  3. Cache results in Supabase to avoid repeat charges.
 *
 * For now it returns the text as-is so the UI still works.
 */
async function translateViaApi(
  textWithDictionaryReplacements: string,
  _from: LanguageCode,
  _to: LanguageCode,
  _gaps: string[]
): Promise<string> {
  // TODO: Wire up Google Cloud Translation v3 or Supabase Edge Function proxy.
  //
  // Implementation plan:
  //   const response = await fetch(EDGE_FUNCTION_URL + "/translate", {
  //     method: "POST",
  //     body: JSON.stringify({ segments: gaps, from, to }),
  //   });
  //   const { translations } = await response.json();
  //   return spliceTranslations(textWithDictionaryReplacements, gaps, translations);

  return textWithDictionaryReplacements;
}

// ─── Convenience Wrappers ────────────────────────────────────────────────────

/** Translate using dictionary only — synchronous-safe, no network. */
export async function translateDictionaryOnly(
  text: string,
  from: LanguageCode
): Promise<TranslationResult> {
  return translate(text, { from, dictionaryOnly: true });
}

/**
 * Translate an entire listing's user-facing text fields.
 * Returns a new object with translated title and description.
 */
export async function translateListingFields(
  fields: { title: string; description?: string },
  from: LanguageCode
): Promise<{
  title: TranslationResult;
  description?: TranslationResult;
}> {
  const title = await translate(fields.title, { from });
  const description = fields.description
    ? await translate(fields.description, { from })
    : undefined;
  return { title, description };
}
