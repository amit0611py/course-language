'use strict';

// Materialized path helpers.
// All business rules about path format live here; nothing else does string splitting.

// 'java.jvm.memory.heap' → ['java', 'java.jvm', 'java.jvm.memory', 'java.jvm.memory.heap']
// Includes self. Used by content.service to build the breadcrumb pathsArray
// from a stored ancestor_paths (ancestors-only) value: [...ancestor_paths, path]
const getAncestorPaths = (path) => {
  const segments = path.split('.');
  return segments.map((_, i) => segments.slice(0, i + 1).join('.'));
};

// 'java.jvm.memory.heap' → ['java', 'java.jvm', 'java.jvm.memory']
// Ancestors ONLY — does NOT include self.
// This matches the ancestor_paths column stored in topics (migration 008).
// Used by the seeder to populate ancestor_paths before upserting a topic.
//
// Algorithm:
//   segments = ['java', 'jvm', 'memory', 'heap']   (length 4, depth 3)
//   For i = 1..depth (1..3):
//     segments.slice(0, i).join('.') → 'java', 'java.jvm', 'java.jvm.memory'
//   Root topics (depth 0) return [].
const getAncestorPathsOnly = (path) => {
  const segments = path.split('.');
  const depth    = segments.length - 1;
  if (depth === 0) return [];
  const result = [];
  for (let i = 1; i <= depth; i++) {
    result.push(segments.slice(0, i).join('.'));
  }
  return result;
};

// 'java.jvm.memory.heap' → 'java.jvm.memory'
const getParentPath = (path) => {
  const lastDot = path.lastIndexOf('.');
  return lastDot === -1 ? null : path.slice(0, lastDot);
};

// 'java.jvm.memory.heap' → 'heap'
const getSlug = (path) => path.split('.').pop();

// 'java.jvm.memory.heap' → 3  (zero-based depth)
const getDepth = (path) => path.split('.').length - 1;

// 'java.jvm.memory.heap' → 'java'
const getLanguageSlug = (path) => path.split('.')[0];

// Validate that a path only contains [a-z0-9-] segments separated by dots
const PATH_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
const isValidPath = (path) => PATH_PATTERN.test(path);

// LIKE pattern for subtree query: 'java.jvm' → 'java.jvm.%'
const getSubtreePattern = (path) => `${path}.%`;

module.exports = {
  getAncestorPaths,
  getAncestorPathsOnly,   // ← new (migration 008): ancestors-only, used by seeder
  getParentPath,
  getSlug,
  getDepth,
  getLanguageSlug,
  isValidPath,
  getSubtreePattern,
};
