const { execSync } = require("node:child_process");

/**
 * Global build metadata, used to cache-bust static assets (JS/CSS) that are
 * served with a long-lived `immutable` Cache-Control header (see
 * netlify.toml). Without this, browsers that already cached an asset never
 * pick up a newer deploy until the cache naturally expires (up to 1 year).
 *
 * `version` is appended as a `?v=` query string to script/link tags so each
 * deploy gets a fresh URL, forcing browsers to fetch the latest file.
 */
function getVersion() {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (err) {
    // Not a git checkout (e.g. some CI archives) - fall back to a
    // timestamp so caches still get busted on every build.
    return String(Date.now());
  }
}

module.exports = {
  version: getVersion(),
};
