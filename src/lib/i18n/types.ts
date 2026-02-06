import type { LanguageCode } from "@/types";

// ─── Dictionary Structure ────────────────────────────────────────────────────

/**
 * A single dictionary entry mapping a source-language term to English.
 *
 * Terms are stored lowercase. Multi-word phrases are supported
 * (e.g. "piano terra" → "ground floor").
 */
export interface DictionaryEntry {
  /** Source term in the original language (lowercase). */
  term: string;
  /** English translation. */
  en: string;
}

/**
 * Semantic categories for real-estate vocabulary.
 * Grouping by category keeps the dictionary maintainable and lets us
 * weight matches differently if needed (e.g. property-type matches
 * are higher-signal than generic adjectives).
 */
export type DictionaryCategory =
  | "property_type"
  | "rooms"
  | "features"
  | "condition"
  | "furniture"
  | "location"
  | "contract"
  | "utilities"
  | "abbreviations";

/**
 * One language's full dictionary: categories → entries.
 */
export type LanguageDictionary = Record<DictionaryCategory, DictionaryEntry[]>;

/**
 * Top-level dictionary: language code → that language's dictionary.
 * Only source languages are keyed here (never "en").
 */
export type RealEstateDictionary = Partial<
  Record<Exclude<LanguageCode, "en">, LanguageDictionary>
>;

// ─── Translation Result ──────────────────────────────────────────────────────

export type TranslationMethod = "dictionary" | "api" | "mixed" | "none";

/**
 * Returned by the translate function so callers know exactly
 * what happened and can show provenance in the UI.
 */
export interface TranslationResult {
  /** The fully translated text (best-effort). */
  translated: string;
  /** Original input text. */
  original: string;
  /** Source language that was provided or detected. */
  sourceLanguage: LanguageCode;
  /** How the translation was produced. */
  method: TranslationMethod;
  /**
   * Segments that the dictionary couldn't handle.
   * Empty array means the dictionary covered everything.
   */
  untranslatedSegments: string[];
  /** Number of dictionary terms that matched. */
  dictionaryHits: number;
}

// ─── Translate Options ───────────────────────────────────────────────────────

export interface TranslateOptions {
  /** Source language of the text. Required — we don't auto-detect. */
  from: LanguageCode;
  /** Target language. Defaults to "en". */
  to?: LanguageCode;
  /**
   * When true, skip the Google Translate API fallback
   * and return dictionary-only results.
   */
  dictionaryOnly?: boolean;
}
