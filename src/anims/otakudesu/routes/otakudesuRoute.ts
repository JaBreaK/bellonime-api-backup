import express from "express";

import { CACHE_TTL_MINUTES } from "@configs/constants.js";
import { serverCache } from "@middlewares/cache.js";
import controller from "@otakudesu/controllers/otakudesuController.js";

const { STATIC, LISTING, DETAIL, STREAM } = CACHE_TTL_MINUTES;

const otakudesuRoute = express.Router();

otakudesuRoute
  .get("/", controller.getMainView)
  .get("/view-data", serverCache(STATIC), controller.getMainViewData)
  .get("/home", serverCache(LISTING), controller.getHome)
  .get("/schedule", serverCache(LISTING), controller.getSchedule)
  .get("/anime", serverCache(LISTING), controller.getAllAnimes)
  .get("/genres", serverCache(STATIC), controller.getAllGenres)
  .get("/ongoing", serverCache(LISTING), controller.getOngoingAnimes)
  .get("/completed", serverCache(LISTING), controller.getCompletedAnimes)
  .get("/search", serverCache(LISTING), controller.getSearch)
  .get("/genres/:genreId", serverCache(LISTING), controller.getGenreAnimes)
  .get("/anime/:animeId", serverCache(DETAIL), controller.getAnimeDetails)
  .get("/episode/:episodeId", serverCache(DETAIL), controller.getAnimeEpisode)
  .get("/server/:serverId", serverCache(STREAM), controller.getServerUrl)
  .post("/server/:serverId", serverCache(STREAM), controller.getServerUrl)
  .get("/batch/:batchId", serverCache(DETAIL), controller.getAnimeBatch);

export default otakudesuRoute;
