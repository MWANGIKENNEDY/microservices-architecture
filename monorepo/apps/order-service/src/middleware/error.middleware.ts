import { Request, Response, NextFunction } from 'express';
import { formatError } from '@monorepo/shared';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: formatError(err),
  });
};
