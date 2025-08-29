import express from "express";
import type { Request, Response, Application } from "express";
import cors, { type CorsOptions } from "cors";
import bodyParser from "body-parser";
import { PORT, NODE_ENV, DEVELOPMENT_URL, PRODUCTION_URL } from "./config";
import router from "./routes";

const app: Application = express();

app.use(express.json());

const corsOptions: CorsOptions = {
  origin: NODE_ENV === "dev" ? DEVELOPMENT_URL : PRODUCTION_URL,
  methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-VERIFY",
    "X-MERCHANT-ID",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("server is healthy");
});

app.use("/api/v1", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
