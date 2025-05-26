import type { TOptions } from "i18next";
import { getI18n, useTranslation } from "react-i18next";

export const useFusionAccessTranslations = () =>
  // MUST be a string literal. DON'T EXTRACT IT TO A VARIABLE!
  useTranslation("plugin__fusion-access-console");

/**
 * Translates text within the plugin namespace
 * Use this function when translating texts outside React-land.
 *
 * @param value Text to translate
 * @param options Translation options
 * @see https://www.i18next.com/overview/api#t
 */
export const t = (value: string, options?: TOptions) =>
  /**
   * The line below, specifically: `.t\(value, ...\)`,
   * produces the warning below that can safely ignored.
   *
   *   "[warning] Key is not a string literal: value".
   */

  getI18n().t(value, {
    // MUST be a string literal. DON'T EXTRACT IT TO A VARIABLE!
    ns: "plugin__fusion-access-console",
    ...options,
  });
