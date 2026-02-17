import { serverCache } from "@middlewares/cache.js";
import mainController from "@controllers/mainController.js";
import express from "express";


const mainRoute = express.Router();

mainRoute.get("/", mainController.getMainView);
mainRoute.get("/docs", mainController.getDocsView);
mainRoute.get("/view-data", serverCache(), mainController.getMainViewData);
mainRoute.get("*", mainController._404);

export default mainRoute;
