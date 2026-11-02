import { browser } from "$app/env";
import { baseLocale, toLocale, overwriteGetLocale, overwriteSetLocale } from "#lib/paraglide/runtime.js";

const COOKIE_NAME = "locale";

export class Locale {
    #current = $state(toLocale(browser && document.querySelector("html")?.lang) ?? baseLocale);

    constructor() {
        overwriteGetLocale(() => this.#current);

        overwriteSetLocale((locale) => {
            this.#current = locale;
            document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=34560000; sameSite=lax`;
            window.location.reload();
        });
    }
}
