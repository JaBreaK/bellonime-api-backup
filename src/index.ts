import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import "dotenv/config";

import { otakudesuInfo, otakudesuRoute } from "@otakudesu/index.js";
import { samehadakuInfo, samehadakuRoute } from "@samehadaku/index.js";
import animeConfig from "@configs/animeConfig.js";
import blockBotUserAgent from "@middlewares/blockBotUserAgent.js";
import corsMiddleware from "@middlewares/cors.js";
import errorHandler from "@middlewares/errorHandler.js";
import requestLogger from "@middlewares/requestLogger.js";
import { clientCache } from "@middlewares/cache.js";
import mainRoute from "@routes/mainRoute.js";

const { PORT } = animeConfig;
const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

const app = express();

// MIDDLEWARES
app.use(blockBotUserAgent);
app.use(corsMiddleware());
app.use(express.static(PUBLIC_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clientCache());
app.use(requestLogger());

// RUTE SUMBER
app.use(otakudesuInfo.baseUrlPath, otakudesuRoute);
app.use(samehadakuInfo.baseUrlPath, samehadakuRoute);

// RUTE UTAMA
app.use(mainRoute);

// ERROR HANDLER
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SERVER BERJALAN DI http://localhost:${PORT}`);
});
