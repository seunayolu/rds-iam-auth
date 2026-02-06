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
        query: async (sql, params) => {
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
      ssl: undefined,
      waitForConnections: true,
      connectionLimit: 5
    });

    return pool;
  }

  log.info("Initializing DB with RDS IAM auth token (signer)");
  const signer = new Signer({
    region: config.region,
    hostname: config.endpoint, // This is your RDS Proxy endpoint
    port: config.port,
    username: config.username  // Ensure this matches 'app_user'
  });

  log.debug("Requesting IAM auth token from signer");
  const token = await signer.getAuthToken();
  log.info("Received IAM auth token");

  pool = mysql.createPool({
    host: config.endpoint,
    user: config.username,
    password: token,
    database: config.dbname,
    // RDS Proxy uses ACM certs. By setting rejectUnauthorized: true 
    // without a 'ca' property, mysql2 uses the system's CA store.
    ssl: {
      rejectUnauthorized: true 
    },
    waitForConnections: true,
    connectionLimit: 5
  });

  log.debug("Created mysql pool", { host: config.endpoint, user: config.username, database: config.dbname });
  return pool;
}