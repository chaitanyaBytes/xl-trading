export const config = {
  dburl: process.env.DATABASE_URL,
  server: {
    port: process.env.PORT || "3000",
    nodeenv: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  ws: {
    port: process.env.WS_PORT || 8080,
  },
};

export * from "./zod/user";
