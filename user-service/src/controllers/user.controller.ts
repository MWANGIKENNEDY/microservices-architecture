import { Request, Response } from "express";
import { getUser } from "../services/user.service";

export const getUserById = async (req: Request, res: Response) => {
  const user = await getUser(req.params.id);
  res.json(user);
};
