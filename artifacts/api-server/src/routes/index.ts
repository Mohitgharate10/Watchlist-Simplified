import { Router, type IRouter } from "express";
import healthRouter from "./health";
import itemsRouter from "./items";
import tmdbRouter from "./tmdb";

const router: IRouter = Router();

router.use(healthRouter);
router.use(itemsRouter);
router.use(tmdbRouter);

export default router;
