import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ERROR_MESSAGE } from "../configs/constants.js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { setResponseError } from "../helpers/error.js";
import generatePayload from "../helpers/payload.js";
import { resolveViewPath, VIEW_FILE } from "../helpers/viewPath.js";
import { otakudesuInfo } from "../anims/otakudesu/index.js";
import { samehadakuInfo } from "../anims/samehadaku/index.js";
const WELCOME_MESSAGE = "BELLONIME API IS READY 🔥🔥🔥";
const ANIMS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "anims");
const ANIME_SOURCES = [otakudesuInfo, samehadakuInfo];
function isSourceAvailable(source) {
    return fs.existsSync(path.join(ANIMS_DIR, source.baseUrlPath));
}
function buildMainViewData() {
    return {
        message: WELCOME_MESSAGE,
        sources: ANIME_SOURCES.filter(isSourceAvailable).map(({ title, baseUrlPath }) => ({
            title,
            route: baseUrlPath,
        })),
    };
}
const mainController = {
    getMainView: asyncHandler((_req, res) => {
        res.sendFile(resolveViewPath(VIEW_FILE.HOME));
    }),
    getDocsView: asyncHandler((_req, res) => {
        res.sendFile(resolveViewPath(VIEW_FILE.DOCS));
    }),
    getMainViewData: asyncHandler((_req, res) => {
        res.json(generatePayload(res, { data: buildMainViewData() }));
    }),
    notFound: asyncHandler(() => {
        setResponseError(404, ERROR_MESSAGE.NOT_FOUND_PAGE);
    }),
};
export default mainController;
