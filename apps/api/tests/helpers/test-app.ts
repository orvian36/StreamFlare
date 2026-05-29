import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "../../src/middleware/error-handler.js";
import usersRouter from "../../src/routes/users.routes.js";
import profileRouter from "../../src/routes/profile.routes.js";
import browseRouter from "../../src/routes/browse.routes.js";
import subscriptionRouter from "../../src/routes/subscription.routes.js";
import adminRouter from "../../src/routes/admin.routes.js";

export function buildTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/users", usersRouter);
  app.use("/api/profiles", profileRouter);
  app.use("/api/browse", browseRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/admin", adminRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
