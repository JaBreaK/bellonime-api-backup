import { clientCache } from "@middlewares/cache.js";
import { otakudesuInfo, otakudesuRoute } from "@otakudesu/index.js";
import { samehadakuInfo, samehadakuRoute } from "@samehadaku/index.js";
import mainRoute from "@routes/mainRoute.js";
import errorHandler from "@middlewares/errorHandler.js";
import animeConfig from "@configs/animeConfig.js";
import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from 'url';
import 'dotenv/config';

const { PORT } = animeConfig;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIDDLEWARES
app.use((req, res, next) => {
  if (process.env.ALLOWED_NO_HEADER === 'true') return next();
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.toLowerCase().includes('node')) {
    return res.status(403).send('Forbidden');
  }
  next();
});
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clientCache(1));

// LOGGER MIDDLEWARE (MORGAN)
morgan.token('body', (req: express.Request) => {
  return Object.keys(req.body || {}).length ? `\n   Body: ${JSON.stringify(req.body)}` : '';
});
morgan.token('query', (req: express.Request) => {
  return Object.keys(req.query || {}).length ? `\n   Query: ${JSON.stringify(req.query)}` : '';
});

app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body :query'));

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

