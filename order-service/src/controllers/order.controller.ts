import { Request, Response } from "express";
import { getUserById } from "../services/user.service";

export const getOrder = async (req: Request, res: Response) => {
  const user = await getUserById("1");

  res.json({
    orderId: req.params.orderId,
    product: "Laptop",
    user
  });
};
