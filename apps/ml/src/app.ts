import express from "express";
import cors from "cors";
import { env } from "./services/env.js";
import recommendRouter from "./routes/recommend.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("ML server is running");
});
app.use("/recommend", recommendRouter);

app.use((_req, _res, next) => {
  const err = new Error("Not found") as Error & { code?: number };
  err.code = 404;
  next(err);
});

app.use(
  (
    err: Error & { code?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(err.code ?? 500).json({ message: err.message });
  },
);

app.listen(env.PORT, () => console.log(`ML server listening on :${env.PORT}`));
