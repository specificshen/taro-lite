import { EventEmitter } from 'node:events';
import * as path from 'node:path';
import type { Func, IProjectConfig, PluginItem } from '@spcsn/taro/types/compile';
import Joi from 'joi';
import _ from 'lodash';
import { AsyncSeriesWaterfallHook } from 'tapable';
import * as helper from '../taro-helper';
import * as runnerUtils from './runner-utils';
import type Config from './service-config';
import Plugin from './service-plugin';
import { convertPluginsToObject, mergePlugins, printHelpLog, resolvePresetsOrPlugins } from './utils';
import { IS_ADD_HOOK, IS_EVENT_HOOK, IS_MODIFY_HOOK, PluginType } from './utils/constants';
import { serviceProfiler } from './utils/profile.js';
import type { ICommand, IHook, IPaths, IPlatform, IPlugin, IPluginsObject, IPreset } from './utils/types';

interface IKernelOptions {
  appPath: string;
  config: Config;
  presets?: PluginItem[];
  plugins?: PluginItem[];
}

export default class Kernel extends EventEmitter {
  appPath: string;
  isWatch!: boolean;
  isProduction!: boolean;
  optsPresets: PluginItem[] | undefined;
  optsPlugins: PluginItem[] | undefined;
  plugins!: Map<string, IPlugin>;
  paths!: IPaths;
  extraPlugins!: IPluginsObject;
  globalExtraPlugins!: IPluginsObject;
  config: Config;
  initialConfig!: IProjectConfig;
  initialGlobalConfig!: IProjectConfig;
  hooks: Map<string, IHook[]>;
  methods: Map<string, Func[]>;
  cliCommands!: string[];
  cliCommandsPath!: string;
  commands: Map<string, ICommand>;
  platforms: Map<string, IPlatform>;
  helper!: Record<string, unknown>;
  runnerUtils: any;
  runOpts: any;
  debugger: any;

  [key: string]: any;

  constructor(options: IKernelOptions) {
    super();
    this.debugger = process.env.DEBUG === 'Taro:Kernel' ? helper.createDebug('Taro:Kernel') : function () {};
    this.appPath = options.appPath || process.cwd();
    this.optsPresets = options.presets;
    this.optsPlugins = options.plugins;
    this.config = options.config;
    this.hooks = new Map();
    this.methods = new Map();
    this.commands = new Map();
    this.platforms = new Map();
    this.initHelper();
    this.initConfig();
    this.initPaths();
    this.initRunnerUtils();
  }

  initConfig() {
    this.initialConfig = this.config.initialConfig;
    this.initialGlobalConfig = this.config.initialGlobalConfig;
    this.debugger('initConfig', this.initialConfig);
  }

  initPaths() {
    this.paths = {
      appPath: this.appPath,
      nodeModulesPath: helper.recursiveFindNodeModules(path.join(this.appPath, helper.NODE_MODULES)),
    } as IPaths;
    if (this.config.isInitSuccess) {
      const sourceRoot = this.initialConfig.sourceRoot || helper.SOURCE_DIR;
      const outputRoot = this.initialConfig.outputRoot || helper.OUTPUT_DIR;
      Object.assign(this.paths, {
        configPath: this.config.configPath,
        sourcePath: path.join(this.appPath, sourceRoot),
        outputPath: path.resolve(this.appPath, outputRoot),
      });
    }
    this.debugger(`initPaths:${JSON.stringify(this.paths, null, 2)}`);
  }

  initHelper() {
    this.helper = helper;
    this.debugger('initHelper');
  }

  initRunnerUtils() {
    this.runnerUtils = runnerUtils;
    this.debugger('initRunnerUtils');
  }

  initPresetsAndPlugins() {
    const initialConfig = this.initialConfig;
    const initialGlobalConfig = this.initialGlobalConfig;
    const cliAndProjectConfigPresets = mergePlugins(this.optsPresets || [], initialConfig.presets || [])();
    const cliAndProjectPlugins = mergePlugins(this.optsPlugins || [], initialConfig.plugins || [])();
    const globalPlugins = convertPluginsToObject(initialGlobalConfig.plugins || [])();
    const globalPresets = convertPluginsToObject(initialGlobalConfig.presets || [])();
    this.debugger('initPresetsAndPlugins', cliAndProjectConfigPresets, cliAndProjectPlugins);
    this.debugger('globalPresetsAndPlugins', globalPlugins, globalPresets);
    if (process.env.NODE_ENV !== 'test') {
      const swcRegisterStartMs = serviceProfiler.start();
      helper.createSwcRegister({
        only: [
          ...Object.keys(cliAndProjectConfigPresets),
          ...Object.keys(cliAndProjectPlugins),
          ...Object.keys(globalPresets),
          ...Object.keys(globalPlugins),
        ],
      });
      serviceProfiler.end('plugin swc register', swcRegisterStartMs);
    }
    this.plugins = new Map();
    this.extraPlugins = {};
    this.globalExtraPlugins = {};
    const resolvePresetsStartMs = serviceProfiler.start();
    this.resolvePresets(cliAndProjectConfigPresets, globalPresets);
    serviceProfiler.end('resolve presets', resolvePresetsStartMs);
    const resolvePluginsStartMs = serviceProfiler.start();
    this.resolvePlugins(cliAndProjectPlugins, globalPlugins);
    serviceProfiler.end('resolve plugins', resolvePluginsStartMs);
  }

  resolvePresets(cliAndProjectPresets: IPluginsObject, globalPresets: IPluginsObject) {
    const resolvedCliAndProjectPresets = resolvePresetsOrPlugins(this.appPath, cliAndProjectPresets, PluginType.Preset);
    while (resolvedCliAndProjectPresets.length) {
      this.initPreset(resolvedCliAndProjectPresets.shift()!);
    }

    const globalConfigRootPath = path.join(helper.getUserHomeDir(), helper.TARO_GLOBAL_CONFIG_DIR);
    const resolvedGlobalPresets = resolvePresetsOrPlugins(globalConfigRootPath, globalPresets, PluginType.Plugin, true);
    while (resolvedGlobalPresets.length) {
      this.initPreset(resolvedGlobalPresets.shift()!, true);
    }
  }

  resolvePlugins(cliAndProjectPlugins: IPluginsObject, globalPlugins: IPluginsObject) {
    cliAndProjectPlugins = _.merge(this.extraPlugins, cliAndProjectPlugins);
    const resolvedCliAndProjectPlugins = resolvePresetsOrPlugins(this.appPath, cliAndProjectPlugins, PluginType.Plugin);

    globalPlugins = _.merge(this.globalExtraPlugins, globalPlugins);
    const globalConfigRootPath = path.join(helper.getUserHomeDir(), helper.TARO_GLOBAL_CONFIG_DIR);
    const resolvedGlobalPlugins = resolvePresetsOrPlugins(globalConfigRootPath, globalPlugins, PluginType.Plugin, true);

    const resolvedPlugins = resolvedCliAndProjectPlugins.concat(resolvedGlobalPlugins);

    while (resolvedPlugins.length) {
      this.initPlugin(resolvedPlugins.shift()!);
    }

    this.extraPlugins = {};
    this.globalExtraPlugins = {};
  }

  initPreset(preset: IPreset, isGlobalConfigPreset?: boolean) {
    this.debugger('initPreset', preset);
    const { id, path, opts, apply } = preset;
    const pluginCtx = this.initPluginCtx({ id, path, ctx: this });
    const { presets, plugins } = apply()(pluginCtx, opts) || {};
    this.registerPlugin(preset);
    if (Array.isArray(presets)) {
      const _presets = resolvePresetsOrPlugins(
        this.appPath,
        convertPluginsToObject(presets)(),
        PluginType.Preset,
        isGlobalConfigPreset,
      );
      while (_presets.length) {
        this.initPreset(_presets.shift()!, isGlobalConfigPreset);
      }
    }
    if (Array.isArray(plugins)) {
      const mergedPlugins = _.merge(
        isGlobalConfigPreset ? this.globalExtraPlugins : this.extraPlugins,
        convertPluginsToObject(plugins)(),
      );
      if (isGlobalConfigPreset) {
        this.globalExtraPlugins = mergedPlugins;
      } else {
        this.extraPlugins = mergedPlugins;
      }
    }
  }

  initPlugin(plugin: IPlugin) {
    const { id, path, opts, apply } = plugin;
    const pluginCtx = this.initPluginCtx({ id, path, ctx: this });
    this.debugger('initPlugin', plugin);
    this.registerPlugin(plugin);
    apply()(pluginCtx, opts);
    this.checkPluginOpts(pluginCtx, opts);
  }

  applyCliCommandPlugin(commandNames: string[] = []) {
    const existsCliCommand: string[] = [];
    for (let i = 0; i < commandNames.length; i++) {
      const commandName = commandNames[i];
      const commandFilePath = path.resolve(this.cliCommandsPath, `${commandName}.js`);
      if (this.cliCommands.includes(commandName)) existsCliCommand.push(commandFilePath);
    }
    const commandPlugins = convertPluginsToObject(existsCliCommand || [])();
    const commandSwcRegisterStartMs = serviceProfiler.start();
    helper.createSwcRegister({ only: [...Object.keys(commandPlugins)] });
    serviceProfiler.end('command swc register', commandSwcRegisterStartMs);
    const resolveCommandPluginsStartMs = serviceProfiler.start();
    const resolvedCommandPlugins = resolvePresetsOrPlugins(this.appPath, commandPlugins, PluginType.Plugin);
    serviceProfiler.end('resolve command plugins', resolveCommandPluginsStartMs);
    while (resolvedCommandPlugins.length) {
      const initCommandPluginStartMs = serviceProfiler.start();
      this.initPlugin(resolvedCommandPlugins.shift()!);
      serviceProfiler.end('init command plugin', initCommandPluginStartMs);
    }
  }

  checkPluginOpts(pluginCtx: any, opts: any) {
    if (typeof pluginCtx.optsSchema !== 'function') {
      return;
    }
    this.debugger('checkPluginOpts', pluginCtx);
    const schema = pluginCtx.optsSchema(Joi);
    if (!Joi.isSchema(schema)) {
      throw new Error(`插件${pluginCtx.id}中设置参数检查 schema 有误，请检查！`);
    }
    const { error } = schema.validate(opts);
    if (error) {
      error.message = `插件${pluginCtx.id}获得的参数不符合要求，请检查！`;
      throw error;
    }
  }

  registerPlugin(plugin: IPlugin) {
    this.debugger('registerPlugin', plugin);
    if (this.plugins.has(plugin.id)) {
      throw new Error(`插件 ${plugin.id} 已被注册`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  initPluginCtx({ id, path, ctx }: { id: string; path: string; ctx: Kernel }) {
    const pluginCtx = new Plugin({ id, path, ctx });
    const internalMethods = ['onReady', 'onStart'];
    const kernelApis = [
      'appPath',
      'plugins',
      'platforms',
      'paths',
      'helper',
      'runOpts',
      'runnerUtils',
      'initialConfig',
      'applyPlugins',
      'applyCliCommandPlugin',
    ];
    internalMethods.forEach((name) => {
      if (!this.methods.has(name)) {
        pluginCtx.registerMethod(name);
      }
    });
    return new Proxy(pluginCtx, {
      get: (target: any, name: string) => {
        if (this.methods.has(name)) {
          const method = this.methods.get(name);
          if (Array.isArray(method)) {
            return (...arg: any[]) => {
              method.forEach((item) => {
                item.apply(this, arg);
              });
            };
          }
          return method;
        }
        if (kernelApis.includes(name)) {
          return typeof this[name] === 'function' ? this[name].bind(this) : this[name];
        }
        return target[name];
      },
    });
  }

  async applyPlugins(args: string | { name: string; initialVal?: any; opts?: any }) {
    let name: string;
    let initialVal: unknown;
    let opts: any;
    if (typeof args === 'string') {
      name = args;
    } else {
      name = args.name;
      initialVal = args.initialVal;
      opts = args.opts;
    }
    this.debugger('applyPlugins');
    this.debugger(`applyPlugins:name:${name}`);
    this.debugger(`applyPlugins:initialVal:${initialVal}`);
    this.debugger(`applyPlugins:opts:${opts}`);
    if (typeof name !== 'string') {
      throw new Error('调用失败，未传入正确的名称！');
    }
    const hooks = this.hooks.get(name) || [];
    if (!hooks.length) {
      return await initialVal;
    }
    const waterfall = new AsyncSeriesWaterfallHook(['arg']);
    if (hooks.length) {
      const resArr: any[] = [];
      for (const hook of hooks) {
        waterfall.tapPromise(
          {
            name: hook.plugin!,
            stage: hook.stage || 0,
            before: hook.before,
          },
          async (arg) => {
            const res = await hook.fn(opts, arg);
            if (IS_MODIFY_HOOK.test(name) || IS_EVENT_HOOK.test(name)) {
              return res;
            }
            if (IS_ADD_HOOK.test(name)) {
              resArr.push(res);
              return resArr;
            }
            return null;
          },
        );
      }
    }
    return await waterfall.promise(initialVal);
  }

  runWithPlatform(platform: string) {
    if (!this.platforms.has(platform)) {
      throw new Error(`不存在编译平台 ${platform}`);
    }
    const config = this.platforms.get(platform)!;
    const withNameConfig = this.config.getConfigWithNamed(config.name, config.useConfigName as string);
    process.env.TARO_PLATFORM = 'mini';
    return withNameConfig;
  }

  setRunOpts(opts: any) {
    this.runOpts = opts;
  }

  runHelp(name: string) {
    const command = this.commands.get(name);
    const defaultOptionsMap = new Map();
    defaultOptionsMap.set('-h, --help', 'output usage information');
    let customOptionsMap = new Map();
    if (command?.optionsMap) {
      customOptionsMap = new Map(Object.entries(command?.optionsMap));
    }
    const optionsMap = new Map([...customOptionsMap, ...defaultOptionsMap]);
    printHelpLog(name, optionsMap, command?.synopsisList ? new Set(command?.synopsisList) : new Set());
  }

  async run(args: string | { name: string; opts?: any }) {
    let name: string;
    let opts: any;
    if (typeof args === 'string') {
      name = args;
    } else {
      name = args.name;
      opts = args.opts;
    }
    this.debugger('command:run');
    this.debugger(`command:run:name:${name}`);
    this.debugger('command:runOpts');
    this.debugger(`command:runOpts:${JSON.stringify(opts, null, 2)}`);
    this.setRunOpts(opts);

    this.debugger('initPresetsAndPlugins');
    const initPluginsStartMs = serviceProfiler.start();
    this.initPresetsAndPlugins();
    serviceProfiler.end('init presets/plugins', initPluginsStartMs);

    await serviceProfiler.measure('onReady hooks', () => this.applyPlugins('onReady'));

    this.debugger('command:onStart');
    await serviceProfiler.measure('onStart hooks', () => this.applyPlugins('onStart'));

    if (!this.commands.has(name)) {
      throw new Error(`${name} 命令不存在`);
    }

    if (opts?.isHelp) {
      return this.runHelp(name);
    }

    if (opts?.options?.platform) {
      const platformConfigStartMs = serviceProfiler.start();
      opts.config = this.runWithPlatform(opts.options.platform);
      serviceProfiler.end('platform config', platformConfigStartMs);

      await serviceProfiler.measure('modifyRunnerOpts hooks', () =>
        this.applyPlugins({
          name: 'modifyRunnerOpts',
          opts: {
            opts: opts?.config,
          },
        }),
      );
    }

    await serviceProfiler.measure(`${name} hooks`, () =>
      this.applyPlugins({
        name,
        opts,
      }),
    );
    serviceProfiler.print('kernel command timings');
  }
}
