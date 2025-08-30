import { config } from "@xl-trading/common";

export const PORT = config.server.port;
export const NODE_ENV = config.server.nodeenv;
export const JWT_SECRET = config.server.JWT_SECRET;

export const DEVELOPMENT_URL = process.env.DEVELOPMENT_URL;
export const PRODUCTION_URL = process.env.PRODUCTION_URL;
