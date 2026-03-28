'use strict';

const projectRepo = require('../repositories/project.repo');
const langRepo    = require('../repositories/language.repo');
const cache       = require('./cache.service');
const { KEYS }    = require('../utils/cacheKeys');
const { NotFoundError } = require('../utils/errors');
const config      = require('../config');

const getProject = async (db, redis, slug) => {
  return cache.getOrSet(
    redis,
    KEYS.project(slug),
    config.cache.ttl.project,
    () => loadProject(db, slug)
  );
};

const loadProject = async (db, slug) => {
  const project = await projectRepo.findBySlugWithTech(db, slug);
  if (!project) throw new NotFoundError(`Project not found: ${slug}`);

  const recommended = project.technologies.filter((t) => t.is_recommended);
  const optional    = project.technologies.filter((t) => !t.is_recommended);

  return {
    project: {
      slug:           project.slug,
      title:          project.title,
      description:    project.description,
      difficulty:     project.difficulty,
      estimatedHours: project.estimated_hours,
      languageSlug:   project.language_slug,
      meta:           project.meta,
    },
    technologies: {
      recommended: recommended.map(formatTech),
      optional:    optional.map(formatTech),
    },
    blocks: project.blocks,
  };
};

const getProjectsByLanguage = async (db, redis, languageSlug) => {
  return cache.getOrSet(
    redis,
    KEYS.projects(languageSlug),
    config.cache.ttl.project,
    async () => {
      const lang = await langRepo.findBySlug(db, languageSlug);
      if (!lang) throw new NotFoundError(`Language not found: ${languageSlug}`);

      const projects = await projectRepo.findByLanguage(db, lang.id);
      return projects.map((p) => ({
        slug:           p.slug,
        title:          p.title,
        description:    p.description,
        difficulty:     p.difficulty,
        estimatedHours: p.estimated_hours,
      }));
    }
  );
};

const formatTech = (t) => ({
  slug:          t.slug,
  name:          t.name,
  iconUrl:       t.icon_url,
  category:      t.category,
  isRecommended: t.is_recommended,
  enabled:       t.is_recommended, // default UI state mirrors recommendation
});

module.exports = { getProject, getProjectsByLanguage };
