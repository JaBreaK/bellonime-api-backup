import { asyncHandler } from "../../../helpers/asyncHandler.js";
import generatePayload from "../../../helpers/payload.js";
import { getOrderParam, getPageParam, getQParam, getUrlParam } from "../../../helpers/queryParams.js";
import { resolveViewPath, VIEW_FILE } from "../../../helpers/viewPath.js";
import samehadakuInfo from "../info/samehadakuInfo.js";
import SamehadakuParser from "../parsers/SamehadakuParser.js";
const { baseUrl, baseUrlPath } = samehadakuInfo;
const parser = new SamehadakuParser(baseUrl, baseUrlPath);
function sendData(res, data, pagination) {
    res.json(generatePayload(res, { data, pagination: pagination }));
}
function resolveOriginUrl(req) {
    const protocol = req.headers["x-forwarded-proto"] ?? req.protocol;
    return `${protocol}://${req.get("host")}`;
}
const samehadakuController = {
    getMainView: asyncHandler((_req, res) => {
        res.sendFile(resolveViewPath(VIEW_FILE.ANIME_SOURCE));
    }),
    getMainViewData: asyncHandler((_req, res) => {
        sendData(res, samehadakuInfo);
    }),
    getHome: asyncHandler(async (_req, res) => {
        sendData(res, await parser.parseHome());
    }),
    getAllGenres: asyncHandler(async (_req, res) => {
        sendData(res, await parser.parseAllGenres());
    }),
    getAllAnimes: asyncHandler(async (_req, res) => {
        sendData(res, await parser.parseAllAnimes());
    }),
    getSchedule: asyncHandler(async (_req, res) => {
        sendData(res, await parser.parseSchedule());
    }),
    getRecentEpisodes: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parseRecentAnime(getPageParam(req));
        sendData(res, data, pagination);
    }),
    getOngoingAnimes: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parseOngoingAnimes(getPageParam(req), getOrderParam(req));
        sendData(res, data, pagination);
    }),
    getCompletedAnimes: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parseCompletedAnimes(getPageParam(req), getOrderParam(req));
        sendData(res, data, pagination);
    }),
    getPopularAnimes: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parsePopularAnimes(getPageParam(req));
        sendData(res, data, pagination);
    }),
    getMovies: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parseMovies(getPageParam(req));
        sendData(res, data, pagination);
    }),
    getBatches: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parseBatches(getPageParam(req));
        sendData(res, data, pagination);
    }),
    getSearch: asyncHandler(async (req, res) => {
        const { data, pagination } = await parser.parseSearch(getQParam(req), getPageParam(req));
        sendData(res, data, pagination);
    }),
    getGenreAnimes: asyncHandler(async (req, res) => {
        const { genreId } = req.params;
        const { data, pagination } = await parser.parseGenreAnimes(genreId, getPageParam(req));
        sendData(res, data, pagination);
    }),
    getAnimeDetails: asyncHandler(async (req, res) => {
        sendData(res, await parser.parseAnimeDetails(req.params.animeId));
    }),
    getAnimeEpisode: asyncHandler(async (req, res) => {
        const data = await parser.parseAnimeEpisode(req.params.episodeId, resolveOriginUrl(req));
        sendData(res, data);
    }),
    getServerUrl: asyncHandler(async (req, res) => {
        const data = await parser.parseServerUrl(req.params.serverId, resolveOriginUrl(req));
        sendData(res, data);
    }),
    getAnimeBatch: asyncHandler(async (req, res) => {
        sendData(res, await parser.parseAnimeBatch(req.params.batchId));
    }),
    getWibuFile: asyncHandler(async (req, res) => {
        res.send(await parser.parseWibuFile(getUrlParam(req)));
    }),
};
export default samehadakuController;
