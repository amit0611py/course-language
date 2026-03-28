'use strict';

const langRepo  = require('../repositories/language.repo');
const topicRepo = require('../repositories/topic.repo');
const cache     = require('./cache.service');
const { KEYS }  = require('../utils/cacheKeys');
const { NotFoundError } = require('../utils/errors');
const config    = require('../config');

// ── Full sidebar navigation tree ─────────────────────────────────────────────
// Returns: { language, sections: [{ ...section, topics: [nested tree] }] }

const getNavigationTree = async (db, redis, languageSlug) => {
  return cache.getOrSet(
    redis,
    KEYS.nav(languageSlug),
    config.cache.ttl.nav,
    () => loadNavigationTree(db, languageSlug)
  );
};

const loadNavigationTree = async (db, languageSlug) => {
  const language = await langRepo.findBySlug(db, languageSlug);
  if (!language) throw new NotFoundError(`Language not found: ${languageSlug}`);

  const rows = await topicRepo.findNavigationRows(db, languageSlug);
  const sections = assembleTree(rows);

  return {
    language: {
      id:          language.id,
      slug:        language.slug,
      name:        language.name,
      iconUrl:     language.icon_url,
      description: language.description,
      meta:        language.meta,
    },
    sections,
  };
};

// ── Tree assembly: flat rows → nested section → topic structure ───────────────
// Runs in JS (not SQL) to keep the DB query simple and avoid recursive CTEs.
// With 5000 topics, this processes ~200 rows per language: negligible overhead.

const assembleTree = (rows) => {
  // Pass 1: collect sections (preserving order)
  const sectionMap   = new Map();   // sectionId → section object
  const sectionOrder = [];          // preserve insertion order

  for (const row of rows) {
    if (!sectionMap.has(row.section_id)) {
      sectionMap.set(row.section_id, {
        id:         row.section_id,
        slug:       row.section_slug,
        title:      row.section_title,
        sortOrder:  row.section_order,
        topics:     [],
        _topicMap:  new Map(),  // path → topic node (temp, removed before return)
      });
      sectionOrder.push(row.section_id);
    }
  }

  // Pass 2: collect topics into their sections
  for (const row of rows) {
    if (!row.topic_id) continue;
    const section = sectionMap.get(row.section_id);
    if (!section) continue;
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
      children:      [],
    });
  }

  // Pass 3: nest children under parents within each section
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

    // Sort children at each level by sortOrder
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
      }));
    }
  );
};

module.exports = { getNavigationTree, getAllLanguages };
