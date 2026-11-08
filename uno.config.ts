import extractorSvelte from "@unocss/extractor-svelte";
import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
    presets: [presetWind4()],
    extractors: [extractorSvelte()],
    shortcuts: {
        page: "max-w-[1920px] mx-auto",
        "page-narrow": "max-w-4xl mx-4 sm:mx-auto bg-white border border-gray-200 rounded-sm my-6 p-6 sm:p-8",
    },
});
