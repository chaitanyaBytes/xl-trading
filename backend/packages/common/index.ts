export const config = {
  dburl: process.env.DATABASE_URL,
  server: {
    port: process.env.PORT || "3000",
    nodeenv: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

export * from "./zod/user";
