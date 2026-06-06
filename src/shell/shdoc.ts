export interface ShdocArg {
  desc: string;
  name: string;
  type: string;
}

export interface ShdocOption {
  desc: string;
  flags: string;
}

export interface ShdocExitCode {
  code: string;
  desc: string;
}

export interface ShdocFunction {
  args: ShdocArg[];
  description: string;
  exitcodes: ShdocExitCode[];
  globals: ShdocArg[];
  isTesting: boolean;
  keywords: ShdocArg[];
  name: string;
  namespace?: string;
  options: ShdocOption[];
}

export interface BashStdlib {
  allFunctions: ShdocFunction[];
  mockTemplates: ShdocFunction[];
}
