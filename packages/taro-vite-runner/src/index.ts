import runner from './index-mini';

const runnerWithDefault = runner as typeof runner & { default: typeof runner };
runnerWithDefault.default = runner;

export = runnerWithDefault;
