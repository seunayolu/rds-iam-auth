const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const env = (process.env.LOG_LEVEL || process.env.DEBUG || "").toLowerCase();
const CURRENT = env === "debug" || env === "1" || env === "true" ? "debug" : "info";

function timestamp() {
  return new Date().toISOString();
}

function format(prefix, args) {
  const parts = [];
  parts.push(`[${timestamp()}]`);
  parts.push(prefix);
  for (const a of args) {
    if (typeof a === "string") parts.push(a);
    else parts.push(JSON.stringify(a));
  }
  return parts.join(" ");
}

export function debug(...args) {
  if (LEVELS[CURRENT] <= LEVELS.debug) console.log(format("[DEBUG]", args));
}

export function info(...args) {
  if (LEVELS[CURRENT] <= LEVELS.info) console.log(format("[INFO]", args));
}

export function warn(...args) {
  console.warn(format("[WARN]", args));
}

export function error(...args) {
  console.error(format("[ERROR]", args));
}

export function child(label) {
  return {
    debug: (...a) => debug(`[${label}]`, ...a),
    info: (...a) => info(`[${label}]`, ...a),
    warn: (...a) => warn(`[${label}]`, ...a),
    error: (...a) => error(`[${label}]`, ...a)
  };
}

export default { debug, info, warn, error, child };
