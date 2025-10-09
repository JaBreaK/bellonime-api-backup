import { clientCache } from "@middlewares/cache.js";
import { otakudesuInfo, otakudesuRoute } from "@otakudesu/index.js";
import { samehadakuInfo, samehadakuRoute } from "@samehadaku/index.js";
import mainRoute from "@routes/mainRoute.js";
import errorHandler from "@middlewares/errorHandler.js";
import animeConfig from "@configs/animeConfig.js";
import path from "path";
import express from "express";
import cors from "cors";
import { fileURLToPath } from 'url';

const { PORT } = animeConfig;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIDDLEWARES
<<<<<<< HEAD
app.use(cors());
=======
const allowedOrigins = ['https://bellonime.web.id', 'https://same.bellonime.web.id'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
>>>>>>> e587dc4 (gass)
app.use(express.static(path.join(__dirname, "public")));
app.use(clientCache(1));

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
  