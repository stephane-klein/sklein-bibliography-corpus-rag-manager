// The documents page remembers whether the reader chose the dense controller.
// A cookie keeps the choice across reloads and is read during SSR, so the first
// paint already uses the right layout.
export const DOCUMENTS_DENSITY_COOKIE = "documents_density";
export const DOCUMENTS_DENSITY_MAX_AGE = 34_560_000;
export const DOCUMENTS_DENSITY_DENSE = "dense";
export const DOCUMENTS_DENSITY_DETAILED = "detailed";

// The header owns the switch and the documents page reads the value through
// this context, so a click updates both without a server round trip.
export const DOCUMENTS_DENSITY_CONTEXT = Symbol("documents-density");
