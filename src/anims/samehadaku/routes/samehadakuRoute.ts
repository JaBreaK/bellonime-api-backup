import express from "express";

import { CACHE_TTL_MINUTES } from "@configs/constants.js";
import { serverCache } from "@middlewares/cache.js";
import controller from "@samehadaku/controllers/samehadakuController.js";

const { STATIC, LISTING, DETAIL, STREAM } = CACHE_TTL_MINUTES;

const samehadakuRoute = express.Router();

samehadakuRoute
  .get("/", controller.getMainView)
  .get("/view-data", serverCache(STATIC), controller.getMainViewData)
  .get("/home", serverCache(LISTING), controller.getHome)
  .get("/genres", serverCache(STATIC), controller.getAllGenres)
  .get("/anime", serverCache(LISTING), controller.getAllAnimes)
  .get("/schedule", serverCache(LISTING), controller.getSchedule)
  .get("/recent", serverCache(LISTING), controller.getRecentEpisodes)
  .get("/ongoing", serverCache(LISTING), controller.getOngoingAnimes)
  .get("/completed", serverCache(LISTING), controller.getCompletedAnimes)
  .get("/popular", serverCache(LISTING), controller.getPopularAnimes)
  .get("/movies", serverCache(LISTING), controller.getMovies)
  .get("/batch", serverCache(DETAIL), controller.getBatches)
  .get("/search", serverCache(LISTING), controller.getSearch)
  .get("/genres/:genreId", serverCache(LISTING), controller.getGenreAnimes)
  .get("/anime/:animeId", serverCache(DETAIL), controller.getAnimeDetails)
  .get("/episode/:episodeId", serverCache(DETAIL), controller.getAnimeEpisode)
  .get("/server/:serverId", serverCache(STREAM), controller.getServerUrl)
  .post("/server/:serverId", serverCache(STREAM), controller.getServerUrl)
  .get("/wibufile", serverCache(STREAM, "text"), controller.getWibuFile)
  .get("/batch/:batchId", serverCache(DETAIL), controller.getAnimeBatch);

export default samehadakuRoute;
