export type Environment = Readonly<Record<string, string | undefined>>;

const TRUTHY_VALUES: ReadonlySet<string> = new Set(["1", "true", "yes", "on"]);

const LOCALE_VARIABLE_NAMES: ReadonlyArray<string> = ["LC_ALL", "LC_CTYPE", "LANG"];

const UTF8_LOCALE_PATTERN = /utf-?8/i;

const isTruthy = (value: string | undefined): boolean =>
  value !== undefined && TRUTHY_VALUES.has(value.toLowerCase());

const explicitlyDisabled = (environment: Environment): boolean =>
  isTruthy(environment.CLAUDE_ECO_NO_EMOJI);

const isJetbrainsJediTerm = (environment: Environment): boolean =>
  environment.TERMINAL_EMULATOR === "JetBrains-JediTerm";

const isDumbTerminal = (environment: Environment): boolean =>
  environment.TERM === "dumb";

const definedLocaleValues = (environment: Environment): ReadonlyArray<string> =>
  LOCALE_VARIABLE_NAMES
    .map((variableName) => environment[variableName])
    .filter((value): value is string => value !== undefined && value.length > 0);

const hasIncompatibleLocale = (environment: Environment): boolean => {
  const localeValues = definedLocaleValues(environment);
  if (localeValues.length === 0) return false;
  return !localeValues.some((value) => UTF8_LOCALE_PATTERN.test(value));
};

const isKnownIncompatibleTerminal = (environment: Environment): boolean =>
  isJetbrainsJediTerm(environment) ||
  isDumbTerminal(environment) ||
  hasIncompatibleLocale(environment);

export const terminalSupportsEmoji = (
  environment: Environment = process.env as Environment,
): boolean => {
  if (explicitlyDisabled(environment)) return false;
  if (isKnownIncompatibleTerminal(environment)) return false;
  return true;
};
