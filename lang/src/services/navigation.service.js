'use strict';

const langRepo  = require('../repositories/language.repo');
const topicRepo = require('../repositories/topic.repo');
const cache     = require('./cache.service');
const { KEYS }  = require('../utils/cacheKeys');
const { NotFoundError } = require('../utils/errors');
const { canAccess } = require('../utils/accessControl');
const config    = require('../config');

// ── Full sidebar navigation tree ──────────────────────────────────────────────
// Authenticated requests bypass cache because isLocked differs per user.

const getNavigationTree = async (db, redis, languageSlug, user = null) => {
  if (user) return loadNavigationTree(db, languageSlug, user);
  return cache.getOrSet(
    redis,
    KEYS.nav(languageSlug),
    config.cache.ttl.nav,
    () => loadNavigationTree(db, languageSlug, null)
  );
};

const loadNavigationTree = async (db, languageSlug, user) => {
  const language = await langRepo.findBySlug(db, languageSlug);
  if (!language) throw new NotFoundError(`Language not found: ${languageSlug}`);

  const langTier   = language.content_tier ?? 'free';
  const langLocked = !canAccess(user, langTier, languageSlug);

  const rows     = await topicRepo.findNavigationRows(db, languageSlug);
  const sections = assembleTree(rows, user, languageSlug, langTier);

  return {
    language: {
      id:          language.id,
      slug:        language.slug,
      name:        language.name,
      iconUrl:     language.icon_url,
      description: language.description,
      meta:        language.meta,
      contentTier: langTier,
      isLocked:    langLocked,
    },
    sections,
  };
};

// ── Tree assembly ─────────────────────────────────────────────────────────────
const assembleTree = (rows, user, languageSlug, languageTier) => {
  const sectionMap   = new Map();
  const sectionOrder = [];

  for (const row of rows) {
    if (!sectionMap.has(row.section_id)) {
      sectionMap.set(row.section_id, {
        id:         row.section_id,
        slug:       row.section_slug,
        title:      row.section_title,
        sortOrder:  row.section_order,
        topics:     [],
        _topicMap:  new Map(),
      });
      sectionOrder.push(row.section_id);
    }
  }

  for (const row of rows) {
    if (!row.topic_id) continue;
    const section    = sectionMap.get(row.section_id);
    if (!section) continue;

    const topicTier  = row.content_tier ?? 'free';
    // Locked when language itself is premium-gated OR the specific topic is
    const isLocked   = !canAccess(user, languageTier, languageSlug) ||
                       !canAccess(user, topicTier, languageSlug);

    section._topicMap.set(row.path, {
      id:            row.topic_id,
      path:          row.path,
      slug:          row.slug,
      title:         row.topic_title,
      depth:         row.depth,
      parentPath:    row.parent_path,
      isDeepDive:    row.is_deep_dive,
      estimatedMins: row.estimated_mins,
      sortOrder:     row.topic_order,
      contentTier:   topicTier,
      isPremium:     topicTier === 'premium' || languageTier === 'premium',
      isLocked,
      children:      [],
    });
  }

  for (const section of sectionMap.values()) {
    const topicMap = section._topicMap;
    const roots    = [];

    for (const topic of topicMap.values()) {
      if (topic.parentPath && topicMap.has(topic.parentPath)) {
        topicMap.get(topic.parentPath).children.push(topic);
      } else {
        roots.push(topic);
      }
    }

    const sortChildren = (nodes) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach((n) => sortChildren(n.children));
    };
    sortChildren(roots);

    section.topics = roots;
    delete section._topicMap;
  }

  return sectionOrder.map((id) => sectionMap.get(id));
};

// ── Language list ─────────────────────────────────────────────────────────────
const getAllLanguages = async (db, redis) => {
  return cache.getOrSet(
    redis,
    KEYS.language(),
    config.cache.ttl.language,
    async () => {
      const langs = await langRepo.findAll(db);
      return langs.map((l) => ({
        id:          l.id,
        slug:        l.slug,
        name:        l.name,
        iconUrl:     l.icon_url,
        description: l.description,
        meta:        l.meta,
        sortOrder:   l.sort_order,
        contentTier: l.content_tier ?? 'free',
      }));
    }
  );
};

module.exports = { getNavigationTree, getAllLanguages };
