import {Request,Response,NextFunction} from 'express';
import {AppError} from './error.middleware';
export function validateQuery(req:Request,_res:Response,next:NextFunction){
  for(const key of ['page','limit']){
    const value=req.query[key];if(value===undefined)continue;
    if(typeof value!=='string'||!/^\d+$/.test(value)||Number(value)<1||(key==='limit'&&Number(value)>500)||Number(value)>1000000)return next(new AppError('Invalid pagination parameters',400,'INVALID_QUERY'));
  }
  next();
}
