import Creator from './create/creator.js';
import Project from './create/project.js';
import doctor from './doctor/index.js';
import { getRootPath } from './util/index.js';
import { defineConfig, type ConfigEnv, type UserConfigExport, type UserConfigFn } from './util/defineConfig.js';

export default {
  doctor,
  Project,
  Creator,
  defineConfig,
  getRootPath,
};

export {
  type ConfigEnv,
  type UserConfigExport,
  type UserConfigFn,
  Creator,
  defineConfig,
  doctor,
  getRootPath,
  Project,
};
