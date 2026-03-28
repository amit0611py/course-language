'use strict';

// All Redis keys are built here.
// Centralising prevents typos and makes global cache invalidation predictable.
//
// Key anatomy:  ce:{type}:v1:{identifier}
//   ce   = content-engine namespace  (avoids collision with other apps on same Redis)
//   v1   = schema version (bump to v2 when block schema changes)
//   type = topic | nav | lang | proj
//
// Invalidation patterns use * glob for SCAN-based deletion.

const V = 'v1';

const KEYS = {
  topic:    (path)         => `ce:topic:${V}:${path}`,
  nav:      (langSlug)     => `ce:nav:${V}:${langSlug}`,
  language: ()             => `ce:lang:${V}:all`,
  project:  (slug)         => `ce:proj:${V}:${slug}`,
  projects: (langSlug)     => `ce:projects:${V}:${langSlug}`,
};

// Patterns for SCAN-based bulk invalidation (used by seeder/admin publish)
const PATTERNS = {
  allTopics:     ()        => `ce:topic:${V}:*`,
  topicSubtree:  (path)    => `ce:topic:${V}:${path}*`,
  nav:           (langSlug)=> `ce:nav:${V}:${langSlug}`,
  allLanguages:  ()        => `ce:lang:${V}:*`,
  allProjects:   ()        => `ce:proj:${V}:*`,
};

module.exports = { KEYS, PATTERNS };
