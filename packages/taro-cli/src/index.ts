import Creator from './create/creator';
import Project from './create/project';
import doctor from './doctor/index';
import { getRootPath } from './util/index';
import { defineConfig, type ConfigEnv, type UserConfigExport, type UserConfigFn } from './util/defineConfig';

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
