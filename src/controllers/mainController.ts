import type { NextFunction, Request, Response } from "express";
import { setResponseError } from "@helpers/error.js";
import { otakudesuInfo } from "@otakudesu/index.js";
import { samehadakuInfo } from "@samehadaku/index.js";
import generatePayload from "@helpers/payload.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mainController = {
  getMainView(req: Request, res: Response, next: NextFunction): void {
    try {
      const getViewFile = (filePath: string) => {
        return path.join(__dirname, "..", "public", "views", filePath);
      };

      res.sendFile(getViewFile("home.html"));
    } catch (error) {
      next(error);
    }
  },

  getDocsView(req: Request, res: Response, next: NextFunction): void {
    try {
      const getViewFile = (filePath: string) => {
        return path.join(__dirname, "..", "public", "views", filePath);
      };

      res.sendFile(getViewFile("docs.html"));
    } catch (error) {
      next(error);
    }
  },

  getMainViewData(req: Request, res: Response, next: NextFunction): void {
    try {
      function getData() {
        const animeSources = {
          otakudesu: otakudesuInfo,
          samehadaku: samehadakuInfo,
        };

        const data = {
          message: "BELLONIME API IS READY 🔥🔥🔥",
          sources: Object.values(animeSources),
        };

        const newData: { message: string; sources: any[] } = {
          message: data.message,
          sources: [],
        };

        data.sources.forEach((source) => {
          const exist = fs.existsSync(path.join(__dirname, "..", "anims", source.baseUrlPath));

          if (exist) {
            newData.sources.push({
              title: source.title,
              route: source.baseUrlPath,
            });
          }
        });

        return newData;
      }

      const data = getData();

      res.json(generatePayload(res, { data }));
    } catch (error) {
      next(error);
    }
  },

  _404(req: Request, res: Response, next: NextFunction): void {
    next(setResponseError(404, "halaman tidak ditemukan"));
  },
};

export default mainController;
