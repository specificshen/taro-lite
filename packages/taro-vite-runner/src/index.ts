import runner from './mini-runner';

const runnerWithDefault = runner as typeof runner & { default: typeof runner };
runnerWithDefault.default = runner;

export = runnerWithDefault;
