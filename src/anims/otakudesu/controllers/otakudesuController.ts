import type { Request, Response } from "express";

import { asyncHandler } from "@helpers/asyncHandler.js";
import generatePayload from "@helpers/payload.js";
import { getPageParam, getQParam } from "@helpers/queryParams.js";
import { resolveViewPath, VIEW_FILE } from "@helpers/viewPath.js";
import otakudesuInfo from "@otakudesu/info/otakudesuInfo.js";
import OtakudesuParser from "@otakudesu/parsers/OtakudesuParser.js";

const { baseUrl, baseUrlPath } = otakudesuInfo;
const parser = new OtakudesuParser(baseUrl, baseUrlPath);

/** Mengirim payload JSON standar berisi data hasil parse. */
function sendData(res: Response, data: unknown, pagination?: unknown): void {
  res.json(generatePayload(res, { data, pagination: pagination as never }));
}

const otakudesuController = {
  getMainView: asyncHandler((_req, res) => {
    res.sendFile(resolveViewPath(VIEW_FILE.ANIME_SOURCE));
  }),

  getMainViewData: asyncHandler((_req, res) => {
    sendData(res, otakudesuInfo);
  }),

  getHome: asyncHandler(async (_req, res) => {
    sendData(res, await parser.parseHome());
  }),

  getSchedule: asyncHandler(async (_req, res) => {
    sendData(res, await parser.parseSchedule());
  }),

  getAllAnimes: asyncHandler(async (_req, res) => {
    sendData(res, await parser.parseAllAnimes());
  }),

  getAllGenres: asyncHandler(async (_req, res) => {
    sendData(res, await parser.parseAllGenres());
  }),

  getOngoingAnimes: asyncHandler(async (req: Request, res) => {
    const { data, pagination } = await parser.parseOngoingAnimes(getPageParam(req));

    sendData(res, data, pagination);
  }),

  getCompletedAnimes: asyncHandler(async (req: Request, res) => {
    const { data, pagination } = await parser.parseCompletedAnimes(getPageParam(req));

    sendData(res, data, pagination);
  }),

  getSearch: asyncHandler(async (req: Request, res) => {
    sendData(res, await parser.parseSearch(getQParam(req)));
  }),

  getGenreAnimes: asyncHandler(async (req: Request, res) => {
    const { genreId } = req.params;
    const { data, pagination } = await parser.parseGenreAnimes(genreId, getPageParam(req));

    sendData(res, data, pagination);
  }),

  getAnimeDetails: asyncHandler(async (req: Request, res) => {
    sendData(res, await parser.parseAnimeDetails(req.params.animeId));
  }),

  getAnimeEpisode: asyncHandler(async (req: Request, res) => {
    sendData(res, await parser.parseAnimeEpisode(req.params.episodeId));
  }),

  getServerUrl: asyncHandler(async (req: Request, res) => {
    sendData(res, await parser.parseServerUrl(req.params.serverId));
  }),

  getAnimeBatch: asyncHandler(async (req: Request, res) => {
    sendData(res, await parser.parseAnimeBatch(req.params.batchId));
  }),
};

export default otakudesuController;
