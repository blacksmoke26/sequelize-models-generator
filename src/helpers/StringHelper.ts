import {singular} from 'pluralize';
// @ts-expect-error skip error
import { noCase } from 'change-case';

export default abstract class StringHelper {
  public static normalize(name: string): string {
    return noCase(name);
  }


  public static namesEqSingular(a?: string | null, b?: string): boolean {
    if (!a && !b) return true
    if (!a || !b) return false
    return this.normalizeSingular(a) === this.normalizeSingular(b)
  }

  public static normalizeSingular(name: string): string {
    return singular(noCase(name));
  }
}
