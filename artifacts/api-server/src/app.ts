import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Serve frontend static files in production
const staticCandidates = [
  path.resolve(__dirname, "../../watchlist/dist/public"),
  path.resolve(process.cwd(), "artifacts/watchlist/dist/public"),
  path.resolve(__dirname, "../public"),
];
const staticPath = staticCandidates.find((dir) => fs.existsSync(dir));

if (staticPath) {
  app.use(express.static(staticPath));
  // Express 5 compatible SPA fallback (app.use does not parse path-to-regexp)
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(staticPath, "index.html"));
  });
}

export default app;
