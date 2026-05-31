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
  name: string;
  options: ShdocOption[];
  namespace?: string;
}
