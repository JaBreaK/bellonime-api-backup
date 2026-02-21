import { setResponseError } from "../helpers/error.js";
import { otakudesuInfo } from "../anims/otakudesu/index.js";
import { samehadakuInfo } from "../anims/samehadaku/index.js";
import generatePayload from "../helpers/payload.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainController = {
    getMainView(req, res, next) {
        try {
            const getViewFile = (filePath) => {
                return path.join(__dirname, "..", "public", "views", filePath);
            };
            res.sendFile(getViewFile("home.html"));
        }
        catch (error) {
            next(error);
        }
    },
    getDocsView(req, res, next) {
        try {
            const getViewFile = (filePath) => {
                return path.join(__dirname, "..", "public", "views", filePath);
            };
            res.sendFile(getViewFile("docs.html"));
        }
        catch (error) {
            next(error);
        }
    },
    getMainViewData(req, res, next) {
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
                const newData = {
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
        }
        catch (error) {
            next(error);
        }
    },
    _404(req, res, next) {
        next(setResponseError(404, "halaman tidak ditemukan"));
    },
};
export default mainController;
