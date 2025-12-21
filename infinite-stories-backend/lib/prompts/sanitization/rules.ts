/**
 * Centralized Sanitization Rules
 *
 * Single source of truth for all term replacements and content filters.
 * Previously duplicated across:
 * - app/api/v1/images/generate-illustration/route.ts
 * - app/api/v1/images/generate-avatar/route.ts
 * - lib/openai/content-filter.ts
 * - app/api/v1/ai-assistant/sanitize-prompt/route.ts
 */

export interface ReplacementRule {
  pattern: RegExp;
  replacement: string;
  reason: string;
  category: 'isolation' | 'violence' | 'fear' | 'inappropriate' | 'negative-emotion' | 'fantasy-creature' | 'atmosphere';
}

/**
 * Phrase replacements (order matters - longer phrases first)
 */
export const PHRASE_REPLACEMENTS: Record<string, Array<[string, string]>> = {
  en: [
    ['standing alone', 'standing with friends'],
    ['sitting alone', 'sitting with companions'],
    ['walking alone', 'walking with friends'],
    ['all alone', 'with magical friends'],
    ['by himself', 'with his friends'],
    ['by herself', 'with her friends'],
    ['by themselves', 'with their companions'],
    ['without anyone', 'with magical companions'],
    ['all by', 'together with'],
    ['on their own', 'with friendly companions'],
    ['dark forest', 'bright enchanted garden'],
    ['dark woods', 'sunny magical meadow'],
    ['scary forest', 'magical garden'],
    ['haunted house', 'magical castle'],
    ['abandoned house', 'cozy cottage'],
    ['fighting with', 'playing with'],
    ['in battle', 'on an adventure'],
  ],
  fr: [
    ['tout seul', 'avec ses amis'],
    ['toute seule', 'avec ses amies'],
    ['château hanté', 'château magique'],
    ['forêt sombre', 'jardin enchanté'],
    ['maison abandonnée', 'cottage douillet'],
  ],
  es: [
    ['todo solo', 'con sus amigos'],
    ['toda sola', 'con sus amigas'],
    ['bosque oscuro', 'jardín encantado'],
    ['casa abandonada', 'cabaña acogedora'],
  ],
  de: [
    ['ganz allein', 'mit Freunden'],
    ['dunkler Wald', 'verzauberter Garten'],
    ['verlassenes Haus', 'gemütliches Häuschen'],
  ],
  it: [
    ['tutto solo', 'con i suoi amici'],
    ['tutta sola', 'con le sue amiche'],
    ['foresta oscura', 'giardino incantato'],
    ['casa abbandonata', 'cottage accogliente'],
  ],
};

/**
 * Word replacements with word boundaries
 */
export const WORD_REPLACEMENTS: Record<string, Array<[string, string, string]>> = {
  // [pattern (without word boundaries), replacement, category]
  en: [
    // Isolation terms (critical for child safety)
    ['alone', 'with friends', 'isolation'],
    ['lonely', 'happy with companions', 'isolation'],
    ['isolated', 'surrounded by friendly creatures', 'isolation'],
    ['abandoned', 'in a cozy magical place', 'isolation'],
    ['solitary', 'with cheerful friends', 'isolation'],
    ['solo', 'with companions', 'isolation'],

    // Atmosphere
    ['dark', 'bright', 'atmosphere'],
    ['scary', 'wonderful', 'fear'],
    ['frightening', 'magical', 'fear'],
    ['terrifying', 'amazing', 'fear'],
    ['spooky', 'enchanting', 'fear'],
    ['haunted', 'magical', 'fear'],
    ['mysterious', 'delightful', 'atmosphere'],
    ['shadowy', 'glowing', 'atmosphere'],
    ['gloomy', 'bright', 'atmosphere'],
    ['eerie', 'cheerful', 'atmosphere'],
    ['creepy', 'friendly', 'fear'],

    // Violence
    ['fighting', 'playing', 'violence'],
    ['battle', 'adventure', 'violence'],
    ['weapon', 'magical wand', 'violence'],
    ['sword', 'toy wand', 'violence'],
    ['swords', 'toy wands', 'violence'],
    ['attacking', 'playing with', 'violence'],
    ['gun', 'magic wand', 'violence'],
    ['knife', 'spoon', 'violence'],
    ['hurt', 'surprised', 'violence'],
    ['pain', 'discomfort', 'violence'],
    ['blood', 'red paint', 'violence'],

    // Negative emotions
    ['sad', 'happy', 'negative-emotion'],
    ['crying', 'smiling', 'negative-emotion'],
    ['tears', 'sparkles', 'negative-emotion'],
    ['upset', 'curious', 'negative-emotion'],
    ['angry', 'determined', 'negative-emotion'],
    ['scared', 'excited', 'negative-emotion'],
    ['afraid', 'brave', 'negative-emotion'],
    ['worried', 'thoughtful', 'negative-emotion'],
    ['frightened', 'amazed', 'negative-emotion'],
    ['depressed', 'cheerful', 'negative-emotion'],
    ['hopeless', 'hopeful', 'negative-emotion'],
    ['despair', 'wonder', 'negative-emotion'],

    // Fantasy creatures
    ['gargoyle', 'friendly stone guardian', 'fantasy-creature'],
    ['ghost', 'friendly spirit', 'fantasy-creature'],
    ['phantom', 'glowing magical friend', 'fantasy-creature'],
    ['monster', 'gentle creature', 'fantasy-creature'],
    ['beast', 'magical companion', 'fantasy-creature'],
    ['demon', 'playful sprite', 'fantasy-creature'],
    ['devil', 'mischievous fairy', 'fantasy-creature'],
    ['witch', 'friendly magical helper', 'fantasy-creature'],
    ['sorcerer', 'wise magical helper', 'fantasy-creature'],
    ['bat', 'butterfly', 'fantasy-creature'],
    ['bats', 'butterflies', 'fantasy-creature'],
    ['nightmare', 'dream', 'fear'],
    ['evil', 'mischievous', 'atmosphere'],
    ['intense', 'interesting', 'atmosphere'],
  ],
  fr: [
    ['seul', 'avec ses amis animaux', 'isolation'],
    ['seule', 'avec ses amies', 'isolation'],
    ['isolé', 'dans un endroit confortable', 'isolation'],
    ['isolée', 'dans un endroit confortable', 'isolation'],
    ['sombre', 'lumineux', 'atmosphere'],
    ['effrayant', 'mystérieux', 'fear'],
    ['cauchemar', 'rêve', 'fear'],
    ['gargouille', 'gardien de pierre amical', 'fantasy-creature'],
    ['fantôme', 'esprit amical', 'fantasy-creature'],
    ['monstre', 'créature gentille', 'fantasy-creature'],
    ['démon', 'lutin espiègle', 'fantasy-creature'],
    ['sorcière', 'aide magique amicale', 'fantasy-creature'],
    ['arme', 'baguette magique', 'violence'],
  ],
  es: [
    ['solo', 'con sus amigos animales', 'isolation'],
    ['sola', 'con sus amigas', 'isolation'],
    ['aislado', 'en un lugar acogedor', 'isolation'],
    ['aislada', 'en un lugar acogedor', 'isolation'],
    ['oscuro', 'brillante', 'atmosphere'],
    ['aterrador', 'misterioso', 'fear'],
    ['pesadilla', 'sueño', 'fear'],
    ['monstruo', 'criatura gentil', 'fantasy-creature'],
    ['demonio', 'duende juguetón', 'fantasy-creature'],
    ['bruja', 'ayudante mágica amigable', 'fantasy-creature'],
    ['arma', 'varita mágica', 'violence'],
  ],
  de: [
    ['allein', 'mit Tierfreunden', 'isolation'],
    ['isoliert', 'an einem gemütlichen Ort', 'isolation'],
    ['dunkel', 'hell', 'atmosphere'],
    ['gruselig', 'geheimnisvoll', 'fear'],
    ['Albtraum', 'Traum', 'fear'],
    ['Monster', 'freundliche Kreatur', 'fantasy-creature'],
    ['Dämon', 'verspielter Kobold', 'fantasy-creature'],
    ['Hexe', 'freundliche magische Helferin', 'fantasy-creature'],
    ['Waffe', 'magisches Werkzeug', 'violence'],
  ],
  it: [
    ['solo', 'con i suoi amici animali', 'isolation'],
    ['sola', 'con le sue amiche', 'isolation'],
    ['isolato', 'in un posto accogliente', 'isolation'],
    ['isolata', 'in un posto accogliente', 'isolation'],
    ['buio', 'luminoso', 'atmosphere'],
    ['spaventoso', 'misterioso', 'fear'],
    ['incubo', 'sogno', 'fear'],
    ['mostro', 'creatura gentile', 'fantasy-creature'],
    ['demone', 'folletto giocoso', 'fantasy-creature'],
    ['strega', 'aiutante magica amichevole', 'fantasy-creature'],
    ['arma', 'bacchetta magica', 'violence'],
  ],
};

/**
 * Banned patterns (prompt injection attempts)
 */
export const BANNED_PATTERNS: RegExp[] = [
  /ignore previous instructions/i,
  /ignore all previous/i,
  /system prompt/i,
  /you are now/i,
  /pretend you are/i,
  /act as if/i,
  /disregard/i,
  /forget your instructions/i,
  /new instructions/i,
  /override/i,
];

/**
 * Terms that indicate high-risk content
 */
export const HIGH_RISK_TERMS: string[] = [
  'alone',
  'isolated',
  'abandoned',
  'nude',
  'naked',
  'undressed',
  'explicit',
  'suicidal',
];

/**
 * Terms that indicate medium-risk content
 */
export const MEDIUM_RISK_TERMS: string[] = [
  'weapon',
  'violence',
  'blood',
  'gun',
  'knife',
  'attack',
  'fight',
  'battle',
  'war',
];

/**
 * Positive additions to ensure child-friendliness
 */
export const POSITIVE_ADDITIONS = {
  companionship: [
    'friends',
    'companions',
    'family',
    'creatures',
    'magical companions',
  ],
  brightness: [
    'bright',
    'colorful',
    'sunny',
    'cheerful',
    'warm sunlight',
    'glowing',
  ],
  safety: [
    'safe',
    'cozy',
    'peaceful',
    'friendly',
  ],
};

/**
 * Default suffix for prompts lacking positive elements
 */
export const CHILD_FRIENDLY_SUFFIX = 'The scene is bright, colorful, cheerful, and child-friendly with warm sunlight and a magical atmosphere.';

/**
 * Companion addition when none detected
 */
export const COMPANION_SUFFIX = 'surrounded by friendly magical creatures and companions.';
