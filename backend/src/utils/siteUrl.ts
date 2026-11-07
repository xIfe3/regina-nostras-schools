/**
 * The school website's main address, for links in emails.
 * FRONTEND_URL may list several addresses separated by commas (e.g. with and
 * without "www"); the first one is used for links.
 */
export const siteUrl = () =>
  (process.env.FRONTEND_URL || "").split(",")[0].trim().replace(/\/+$/, "");
