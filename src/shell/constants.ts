export const BASH_STDLIB_PREFIX = "Bash STDLIB:";
export const FETCH_ERROR_MESSAGE = "Failed to fetch documentation";

export const getDocumentationUrls = (language: string) => ({
  normal: `https://bash-stdlib.readthedocs.io/${language}/latest/reference/src/REFERENCE_COMPLETE.html`,
  testing: `https://bash-stdlib.readthedocs.io/${language}/latest/reference_testing/src/testing/REFERENCE_COMPLETE.html`
});
