import type {
  RealEstateDictionary,
  LanguageDictionary,
  DictionaryEntry,
} from "./types";

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Shorthand to avoid repeating { term, en } for every entry. */
const e = (term: string, en: string): DictionaryEntry => ({ term, en });

// ─── Italian ─────────────────────────────────────────────────────────────────

const it: LanguageDictionary = {
  property_type: [
    e("appartamento", "apartment"),
    e("monolocale", "studio"),
    e("bilocale", "one-bedroom"),
    e("trilocale", "two-bedroom"),
    e("quadrilocale", "three-bedroom"),
    e("attico", "penthouse"),
    e("mansarda", "attic apartment"),
    e("villa", "villa"),
    e("villetta", "small villa"),
    e("casa", "house"),
    e("loft", "loft"),
    e("stanza", "room"),
    e("posto letto", "bed in shared room"),
  ],
  rooms: [
    e("camera da letto", "bedroom"),
    e("camera", "room"),
    e("soggiorno", "living room"),
    e("cucina", "kitchen"),
    e("bagno", "bathroom"),
    e("ripostiglio", "storage room"),
    e("ingresso", "entrance"),
    e("corridoio", "hallway"),
    e("sala da pranzo", "dining room"),
    e("studio", "study"),
  ],
  features: [
    e("balcone", "balcony"),
    e("terrazza", "terrace"),
    e("giardino", "garden"),
    e("garage", "garage"),
    e("posto auto", "parking space"),
    e("cantina", "cellar"),
    e("ascensore", "elevator"),
    e("portiere", "doorman"),
    e("aria condizionata", "air conditioning"),
    e("riscaldamento autonomo", "independent heating"),
    e("riscaldamento centralizzato", "central heating"),
    e("fibra ottica", "fiber optic"),
    e("videocitofono", "video intercom"),
    e("doppi vetri", "double glazing"),
  ],
  condition: [
    e("ristrutturato", "renovated"),
    e("nuovo", "new"),
    e("ottimo stato", "excellent condition"),
    e("buono stato", "good condition"),
    e("da ristrutturare", "needs renovation"),
    e("abitabile", "move-in ready"),
  ],
  furniture: [
    e("arredato", "furnished"),
    e("non arredato", "unfurnished"),
    e("parzialmente arredato", "partially furnished"),
    e("semi arredato", "semi-furnished"),
  ],
  location: [
    e("centro", "city center"),
    e("centro storico", "historic center"),
    e("periferia", "outskirts"),
    e("zona residenziale", "residential area"),
    e("piano terra", "ground floor"),
    e("primo piano", "first floor"),
    e("ultimo piano", "top floor"),
    e("piano alto", "high floor"),
    e("luminoso", "bright"),
    e("vista mare", "sea view"),
    e("vista lago", "lake view"),
  ],
  contract: [
    e("affitto", "rent"),
    e("locazione", "lease"),
    e("contratto transitorio", "temporary contract"),
    e("spese condominiali", "condo fees"),
    e("cauzione", "security deposit"),
    e("canone mensile", "monthly rent"),
    e("disponibile subito", "available immediately"),
    e("libero da", "available from"),
  ],
  utilities: [
    e("spese incluse", "utilities included"),
    e("spese escluse", "utilities excluded"),
    e("condominio", "condo fees"),
    e("classe energetica", "energy class"),
  ],
  abbreviations: [
    e("mq", "sqm"),
    e("m²", "sqm"),
    e("app.to", "apartment"),
    e("risc.", "heating"),
    e("cond.", "condo"),
    e("p.t.", "ground floor"),
  ],
};

// ─── French ──────────────────────────────────────────────────────────────────

const fr: LanguageDictionary = {
  property_type: [
    e("appartement", "apartment"),
    e("studio", "studio"),
    e("maison", "house"),
    e("villa", "villa"),
    e("chambre", "room"),
    e("loft", "loft"),
    e("duplex", "duplex"),
    e("t1", "1-room"),
    e("t2", "2-room"),
    e("t3", "3-room"),
    e("t4", "4-room"),
    e("t5", "5-room"),
    e("f1", "1-room"),
    e("f2", "2-room"),
    e("f3", "3-room"),
    e("f4", "4-room"),
  ],
  rooms: [
    e("chambre à coucher", "bedroom"),
    e("chambre", "bedroom"),
    e("séjour", "living room"),
    e("salon", "living room"),
    e("cuisine", "kitchen"),
    e("cuisine équipée", "fitted kitchen"),
    e("cuisine américaine", "open-plan kitchen"),
    e("salle de bain", "bathroom"),
    e("salle d'eau", "shower room"),
    e("toilettes", "toilet"),
    e("wc", "toilet"),
    e("entrée", "entrance"),
    e("couloir", "hallway"),
    e("salle à manger", "dining room"),
    e("pièce", "room"),
    e("pièces", "rooms"),
  ],
  features: [
    e("balcon", "balcony"),
    e("terrasse", "terrace"),
    e("jardin", "garden"),
    e("parking", "parking"),
    e("garage", "garage"),
    e("cave", "cellar"),
    e("ascenseur", "elevator"),
    e("gardien", "concierge"),
    e("climatisation", "air conditioning"),
    e("chauffage collectif", "central heating"),
    e("chauffage individuel", "individual heating"),
    e("interphone", "intercom"),
    e("digicode", "keypad entry"),
    e("double vitrage", "double glazing"),
    e("parquet", "hardwood floor"),
    e("vis-à-vis", "overlooking"),
  ],
  condition: [
    e("rénové", "renovated"),
    e("refait à neuf", "fully renovated"),
    e("neuf", "new"),
    e("bon état", "good condition"),
    e("très bon état", "very good condition"),
    e("à rénover", "needs renovation"),
    e("travaux à prévoir", "work needed"),
  ],
  furniture: [
    e("meublé", "furnished"),
    e("non meublé", "unfurnished"),
    e("vide", "unfurnished"),
    e("équipé", "equipped"),
    e("semi-meublé", "semi-furnished"),
  ],
  location: [
    e("centre-ville", "city center"),
    e("centre ville", "city center"),
    e("quartier", "neighbourhood"),
    e("banlieue", "suburb"),
    e("rez-de-chaussée", "ground floor"),
    e("rez de chaussée", "ground floor"),
    e("étage", "floor"),
    e("dernier étage", "top floor"),
    e("lumineux", "bright"),
    e("calme", "quiet"),
    e("vue mer", "sea view"),
    e("vue dégagée", "open view"),
    e("plein sud", "south-facing"),
    e("traversant", "dual-aspect"),
  ],
  contract: [
    e("loyer", "rent"),
    e("bail", "lease"),
    e("charges comprises", "charges included"),
    e("charges", "charges"),
    e("dépôt de garantie", "security deposit"),
    e("honoraires", "agency fees"),
    e("disponible immédiatement", "available immediately"),
    e("disponible le", "available from"),
    e("particulier", "private owner"),
    e("agence", "agency"),
  ],
  utilities: [
    e("charges incluses", "utilities included"),
    e("charges en sus", "utilities extra"),
    e("dpe", "energy rating"),
    e("classe énergie", "energy class"),
  ],
  abbreviations: [
    e("m²", "sqm"),
    e("cc", "charges included"),
    e("hc", "charges excluded"),
    e("apt", "apartment"),
    e("sdb", "bathroom"),
    e("rdc", "ground floor"),
    e("pkg", "parking"),
    e("asc", "elevator"),
  ],
};

// ─── Spanish ─────────────────────────────────────────────────────────────────

const es: LanguageDictionary = {
  property_type: [
    e("piso", "apartment"),
    e("apartamento", "apartment"),
    e("estudio", "studio"),
    e("casa", "house"),
    e("chalet", "detached house"),
    e("adosado", "semi-detached house"),
    e("ático", "penthouse"),
    e("dúplex", "duplex"),
    e("villa", "villa"),
    e("habitación", "room"),
    e("loft", "loft"),
  ],
  rooms: [
    e("dormitorio", "bedroom"),
    e("habitación", "room"),
    e("salón", "living room"),
    e("sala de estar", "living room"),
    e("cocina", "kitchen"),
    e("cocina americana", "open-plan kitchen"),
    e("cocina equipada", "fitted kitchen"),
    e("baño", "bathroom"),
    e("aseo", "toilet"),
    e("recibidor", "entrance hall"),
    e("pasillo", "hallway"),
    e("comedor", "dining room"),
    e("despacho", "study"),
    e("trastero", "storage room"),
  ],
  features: [
    e("balcón", "balcony"),
    e("terraza", "terrace"),
    e("jardín", "garden"),
    e("garaje", "garage"),
    e("plaza de garaje", "parking space"),
    e("piscina", "pool"),
    e("ascensor", "elevator"),
    e("portero", "doorman"),
    e("aire acondicionado", "air conditioning"),
    e("calefacción central", "central heating"),
    e("calefacción individual", "individual heating"),
    e("videoportero", "video intercom"),
    e("doble acristalamiento", "double glazing"),
    e("armarios empotrados", "built-in wardrobes"),
    e("parquet", "hardwood floor"),
    e("suelo radiante", "underfloor heating"),
  ],
  condition: [
    e("reformado", "renovated"),
    e("a reformar", "needs renovation"),
    e("nuevo", "new"),
    e("obra nueva", "new build"),
    e("buen estado", "good condition"),
    e("muy buen estado", "very good condition"),
    e("a estrenar", "brand new"),
  ],
  furniture: [
    e("amueblado", "furnished"),
    e("sin amueblar", "unfurnished"),
    e("semi amueblado", "semi-furnished"),
    e("con muebles", "with furniture"),
    e("sin muebles", "without furniture"),
  ],
  location: [
    e("centro", "city center"),
    e("casco antiguo", "old town"),
    e("barrio", "neighbourhood"),
    e("afueras", "outskirts"),
    e("planta baja", "ground floor"),
    e("primera planta", "first floor"),
    e("última planta", "top floor"),
    e("exterior", "exterior-facing"),
    e("interior", "interior-facing"),
    e("luminoso", "bright"),
    e("tranquilo", "quiet"),
    e("vistas al mar", "sea view"),
    e("orientación sur", "south-facing"),
  ],
  contract: [
    e("alquiler", "rent"),
    e("arrendamiento", "lease"),
    e("fianza", "security deposit"),
    e("gastos incluidos", "expenses included"),
    e("gastos de comunidad", "community fees"),
    e("disponible", "available"),
    e("particular", "private owner"),
    e("inmobiliaria", "real estate agency"),
  ],
  utilities: [
    e("gastos incluidos", "utilities included"),
    e("gastos no incluidos", "utilities excluded"),
    e("certificado energético", "energy certificate"),
    e("comunidad", "community fees"),
  ],
  abbreviations: [
    e("m²", "sqm"),
    e("hab.", "rooms"),
    e("dorm.", "bedrooms"),
    e("asc.", "elevator"),
    e("a/a", "air conditioning"),
    e("c/", "with"),
    e("s/", "without"),
  ],
};

// ─── Assembled Dictionary ────────────────────────────────────────────────────

export const DICTIONARY: RealEstateDictionary = { it, fr, es };

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/**
 * Build a flat term → english map for a given language,
 * sorted by term length descending so longest-match-first works.
 *
 * Result is cached per language code.
 */
const flatCache = new Map<string, [string, string][]>();

export function getFlatDictionary(
  lang: string
): ReadonlyArray<readonly [string, string]> {
  const cached = flatCache.get(lang);
  if (cached) return cached;

  const dict = DICTIONARY[lang as keyof typeof DICTIONARY];
  if (!dict) return [];

  const entries: [string, string][] = [];
  for (const category of Object.values(dict)) {
    for (const { term, en } of category) {
      entries.push([term.toLowerCase(), en]);
    }
  }

  // Longest terms first — greedy matching avoids partial hits.
  entries.sort((a, b) => b[0].length - a[0].length);

  flatCache.set(lang, entries);
  return entries;
}
