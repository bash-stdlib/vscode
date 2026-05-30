export interface ShdocArg {
  name: string;
  type: string;
  desc: string;
}

export interface ShdocOption {
  flags: string;
  desc: string;
}

export interface ShdocExitCode {
  code: string;
  desc: string;
}

export interface ShdocFunction {
  name: string;
  description: string;
  args: ShdocArg[];
  options: ShdocOption[];
  exitcodes: ShdocExitCode[];
}
