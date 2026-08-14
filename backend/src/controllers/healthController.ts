import { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response) => {
  res.json({ message: "AI Learning Search API is running" });
};
