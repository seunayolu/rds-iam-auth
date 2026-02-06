import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { child } from "./logger.js";

const log = child("config");

// Initialize SSM client with region from env or default to us-east-1
const region = process.env.AWS_REGION || "us-east-1";
const ssm = new SSMClient({ region });

const PARAMS = [
  "/demo/rds/endpoint",
  "/demo/rds/port",
  "/demo/rds/dbname",
  "/demo/rds/username",
  "/demo/rds/region"
];

// loadConfig supports a local/dev fallback when `USE_LOCAL_CONFIG` is set
export async function loadConfig() {
  const useLocal =
    process.env.USE_LOCAL_CONFIG === "1" ||
    process.env.USE_LOCAL_CONFIG === "true";

  if (useLocal) {
    log.info("Using local config fallback");
    const conf = {
      endpoint: process.env.LOCAL_DB_HOST || "127.0.0.1",
      port: Number(process.env.LOCAL_DB_PORT || 3306),
      dbname: process.env.LOCAL_DB_NAME || "test",
      username: process.env.LOCAL_DB_USER || "root",
      region: process.env.AWS_REGION || process.env.LOCAL_AWS_REGION || "us-east-1"
    };
    log.debug("Local config:", conf);
    return conf;
  }

  log.info("Requesting parameters from SSM: %s", PARAMS.join(", "));
  const res = await ssm.send(
    new GetParametersCommand({
      Names: PARAMS,
      WithDecryption: false
    })
  );

  const map = {};
  if (res.Parameters) {
    for (const p of res.Parameters) {
      map[p.Name] = p.Value;
    }
    log.info("Fetched %d parameters from SSM", res.Parameters.length);
    log.debug("Parameter keys: %s", Object.keys(map).join(", "));
  } else {
    log.warn("No parameters returned from SSM");
  }

  const conf = {
    endpoint: map["/demo/rds/endpoint"],
    port: Number(map["/demo/rds/port"]),
    dbname: map["/demo/rds/dbname"],
    username: map["/demo/rds/username"],
    region: map["/demo/rds/region"]
  };

  log.debug("Loaded config:", { endpoint: conf.endpoint, port: conf.port, dbname: conf.dbname, username: conf.username });
  return conf;
}