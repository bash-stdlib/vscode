export function getAlphanumericTriggers(): string[] {
  const triggers: string[] = [];

  // lowercase a-z
  for (let i = 97; i <= 122; i++) {
    triggers.push(String.fromCharCode(i));
  }

  // uppercase A-Z
  for (let i = 65; i <= 90; i++) {
    triggers.push(String.fromCharCode(i));
  }

  // numbers 0-9
  for (let i = 0; i <= 9; i++) {
    triggers.push(i.toString());
  }

  // underscore
  triggers.push("_");

  return triggers;
}
