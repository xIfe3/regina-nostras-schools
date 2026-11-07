import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = Object.assign(new Error(`Not found - ${req.originalUrl}`), {
    statusCode: 404,
  });
  res.status(404);
  next(error);
};
