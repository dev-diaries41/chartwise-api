import { NextFunction, Request, Response } from "express";
import { cache, chartAnalysisQueue } from "../index";
import { addJob, addRecurringJob, getJobResults } from "./queue";
import { verifyJobAccess } from "../middleware";
import { AuthErrors, ServerErrors } from "../constants/errors";
import { getAnalysis, saveChartAnalysis } from "../services/analysis";
import { logger } from "../logger";
import { StoredAnalysisSchema } from "../utils/validation";


export async function analyseChart (req: Request, res: Response){
  await addJob({
    req,
    res,
    queueManager: chartAnalysisQueue,
  });
};


export async function getAnalysisResult(req: Request, res: Response){
  await getJobResults({
    req,
    res,
    queueManager: chartAnalysisQueue,
  })
};

export async function authAnalysisResults(req: Request, res: Response, next: NextFunction){ 
  await verifyJobAccess(req, res, next, chartAnalysisQueue)
}

export async function analyseChartRecurring (req: Request, res: Response){
  await addRecurringJob({
    req,
    res,
    queueManager: chartAnalysisQueue,
  });
};

export async function saveAnalysis(req: Request, res: Response) {
  try {
    const userId = req.jwtPayload?.userId ;
    const {analysis} = req.body;
    if(!userId) return res.status(400).json({ message: AuthErrors.INVALID_USER_ID});

    const validatedAnalysis = StoredAnalysisSchema.safeParse({...(analysis||{}), userId});
    if(!validatedAnalysis.success)return res.status(400).json({ message: validatedAnalysis.error});

    const {id} = await saveChartAnalysis({...validatedAnalysis.data, userId})
    return res.status(200).json({ message: 'Analysis saved successfully', data: id }); 
  } catch (error: any) {
    logger.error({message: `Error in saveAnalysis`, details: error.message});
    return res.status(500).json({ message: ServerErrors.INTERNAL_SERVER });
  }
}

export async function getSharedAnalysis(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'A valid ID is required' });
    }

    const cacheKey = `sharedAnalysis:${id}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ data: cachedData });
    }

    const savedAnalysis = await getAnalysis(id);
    await cache.set(cacheKey, savedAnalysis);
    return res.status(200).json({ data: savedAnalysis });
  } catch (error: any) {
    logger.error({ message: `Error in getAnalysis`, details: { id: req.params.id } });
    res.status(500).json({ message: ServerErrors.INTERNAL_SERVER });
  }
}