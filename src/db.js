import mysql from "mysql2/promise";
import { Signer } from "@aws-sdk/rds-signer";
import { readFileSync } from "fs";
import { child } from "./logger.js";

const log = child("db");

let pool;

export async function initDb(config) {
  if (pool) return pool;

  const useLocal =
    process.env.USE_LOCAL_CONFIG === "1" ||
    process.env.USE_LOCAL_CONFIG === "true";

  if (useLocal) {
    log.info("Initializing DB in local mode");
    const localPassword = process.env.LOCAL_DB_PASSWORD;

    if (!localPassword) {
      log.warn("No LOCAL_DB_PASSWORD provided — using a stub pool (no real DB calls)");
      pool = {
        query: async (sql, params) => {
          const s = String(sql).trim().toLowerCase();
          log.debug("Stub pool received query:", s, params || []);
          if (s.startsWith("select")) return [[]];
          return [{}];
        }
      };

      return pool;
    }

    log.debug("Creating local mysql pool", { host: config.endpoint, user: config.username, database: config.dbname });
    pool = mysql.createPool({
      host: config.endpoint,
      user: config.username,
      password: localPassword,
      database: config.dbname,
      ssl: undefined,
      waitForConnections: true,
      connectionLimit: 5
    });

    return pool;
  }

  log.info("Initializing DB with RDS IAM auth token (signer)");
  const signer = new Signer({
    region: config.region,
    hostname: config.endpoint,
    port: config.port,
    username: config.username
  });

  log.debug("Requesting IAM auth token from signer");
  const token = await signer.getAuthToken();
  log.info("Received IAM auth token (value not logged)");

  pool = mysql.createPool({
    host: config.endpoint,
    user: config.username,
    password: token,
    database: config.dbname,
    ssl: getSslConfig(),
    waitForConnections: true,
    connectionLimit: 5
  });

  log.debug("Created mysql pool", { host: config.endpoint, user: config.username, database: config.dbname, ssl: true });
  return pool;
}

function getSslConfig() {
  // Try to load RDS CA cert if available; otherwise use rejectUnauthorized: false for dev
  try {
    const ca = readFileSync("/app/rds-ca-bundle.pem", "utf8");
    log.debug("Using RDS CA certificate bundle");
    return { ca, rejectUnauthorized: true };
  } catch {
    log.warn("RDS CA certificate not found; disabling certificate validation (dev mode only)");
    return { rejectUnauthorized: false };
  }
}