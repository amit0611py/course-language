'use strict';

const langRepo    = require('../../src/repositories/language.repo');
const sectionRepo = require('../../src/repositories/section.repo');

const loadLanguage = async (db, langConfig) => {
  // Upsert language row
  const lang = await langRepo.upsert(db, langConfig);

  // Upsert sections if provided
  if (langConfig.sections?.length) {
    for (const section of langConfig.sections) {
      await sectionRepo.upsert(db, lang.id, section);
    }
  }

  return lang;
};

module.exports = { loadLanguage };
