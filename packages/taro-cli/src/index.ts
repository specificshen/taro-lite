import Creator from './create/creator';
import Project from './create/project';
import doctor from './doctor/index';
import { type ConfigEnv, defineConfig, type UserConfigExport, type UserConfigFn } from './util/define-config';
import { getRootPath } from './util/index';

export default {
  doctor,
  Project,
  Creator,
  defineConfig,
  getRootPath,
};

export {
  type ConfigEnv,
  Creator,
  defineConfig,
  doctor,
  getRootPath,
  Project,
  type UserConfigExport,
  type UserConfigFn,
};
