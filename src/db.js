import mysql from "mysql2/promise";
import { Signer } from "@aws-sdk/rds-signer";
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
      log.warn("No LOCAL_DB_PASSWORD provided — using a stub pool");
      pool = {
        query: async (sql) => {
          const s = String(sql).trim().toLowerCase();
          if (s.startsWith("select")) return [[]];
          return [{}];
        }
      };
      return pool;
    }

    pool = mysql.createPool({
      host: config.endpoint,
      user: config.username,
      password: localPassword,
      database: config.dbname,
      waitForConnections: true,
      connectionLimit: 5
    });

    return pool;
  }

  // ===== RDS IAM AUTH PATH =====
  log.info("Initializing DB with RDS IAM auth token (signer)");

  const signer = new Signer({
    region: config.region,
    hostname: config.endpoint, // RDS Proxy endpoint
    port: config.port,
    username: config.username
  });

  log.debug("Requesting IAM auth token from signer");
  const token = await signer.getAuthToken();
  log.info("Received IAM auth token");

  pool = mysql.createPool({
    host: config.endpoint,
    user: config.username,
    password: token,
    database: config.dbname,

    // REQUIRED for MySQL IAM auth
    // mysql2 will NOT send the token unless this is enabled
    authPlugins: {
      mysql_clear_password: () => token
    },

    // RDS Proxy presents ACM-managed certs
    ssl: "Amazon RDS",

    waitForConnections: true,
    connectionLimit: 5
  });

  log.debug("Created mysql pool", {
    host: config.endpoint,
    user: config.username,
    database: config.dbname
  });

  return pool;
}