import express from "express";
import cors from "cors";
import { env } from "./services/env.js";
import { notFound, errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

// Route mounts added in Tasks 7–10:
// app.use("/api/users", usersRouter);
// app.use("/api/profiles", profileRouter);
// app.use("/api/browse", browseRouter);
// app.use("/api/subscription", subscriptionRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`);
});
