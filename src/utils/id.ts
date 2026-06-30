// nanoid's secure default needs crypto.getRandomValues, which isn't reliably
// available in React Native. The non-secure variant is fine for local entry ids.
import { nanoid } from "nanoid/non-secure";

export function newId(): string {
  return nanoid();
}
