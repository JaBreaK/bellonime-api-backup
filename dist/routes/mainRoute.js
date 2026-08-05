import express from "express";
import mainController from "../controllers/mainController.js";
import { serverCache } from "../middlewares/cache.js";
const mainRoute = express.Router();
mainRoute
    .get("/", mainController.getMainView)
    .get("/docs", mainController.getDocsView)
    .get("/view-data", serverCache(), mainController.getMainViewData)
    .get("*", mainController.notFound);
export default mainRoute;
