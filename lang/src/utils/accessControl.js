'use strict';

// ── Access Control ────────────────────────────────────────────────────────────
// ALL content-gating decisions live here. Routes and repos must NOT implement
// their own access logic — they call canAccess() and gateBlocks() only.
//
// canAccess(user, contentTier, languageSlug) → boolean
//
// Rules:
//   content_tier = 'free'    → always accessible
//   content_tier = 'premium' → requires one of:
//     user.premiumScope = 'all'
//     user.premiumScope = 'language' AND languageSlug ∈ user.premiumLanguageSlugs

/**
 * @param {object|null} user  — req.user (null if anonymous)
 * @param {'free'|'premium'} contentTier
 * @param {string} [languageSlug]
 * @returns {boolean}
 */
const canAccess = (user, contentTier, languageSlug = '') => {
  if (contentTier === 'free') return true;
  if (!user || !user.isPremium) return false;
  if (user.premiumScope === 'all') return true;
  if (user.premiumScope === 'language' && languageSlug) {
    return (user.premiumLanguageSlugs ?? []).includes(languageSlug);
  }
  return false;
};

/**
 * Truncate text to ~100 words for a premium snippet preview.
 */
const snippetText = (text = '', wordLimit = 100) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '…';
};

/**
 * Truncate a blocks array for locked users.
 * Returns the first text block as a 80-word snippet + a premium_gate marker.
 * Frontend renders the premium_gate block as a lock overlay.
 */
const gateBlocks = (blocks = [], user, languageSlug) => {
  if (!blocks.length) return blocks;

  const first = blocks[0];
  const preview = first.type === 'text'
    ? { ...first, data: { ...first.data, content: snippetText(first.data?.content ?? '', 80) } }
    : first;

  return [
    preview,
    { type: 'premium_gate', data: { lockedCount: blocks.length - 1, languageSlug } },
  ];
};

module.exports = { canAccess, snippetText, gateBlocks };
