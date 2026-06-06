import runner from './entrypoints/mini-runner';

const runnerWithDefault = runner as typeof runner & { default: typeof runner };
runnerWithDefault.default = runner;

export = runnerWithDefault;
