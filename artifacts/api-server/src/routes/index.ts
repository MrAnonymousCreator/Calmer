import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import marketsRouter from "./markets.js";
import analysisRouter from "./analysis.js";
import chartRouter from "./chart.js";
import snapshotsRouter from "./snapshots.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketsRouter);
router.use(analysisRouter);
router.use(chartRouter);
router.use(snapshotsRouter);

export default router;
