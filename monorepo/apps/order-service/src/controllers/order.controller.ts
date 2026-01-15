import { Request, Response } from 'express';
import { Order, generateId } from '@monorepo/shared';
import { getUserById } from '../services/user.service';

const orders: Order[] = [];

export const getOrders = async (req: Request, res: Response) => {
  res.json({ success: true, data: orders });
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, product, quantity, total } = req.body;

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const order: Order = {
      id: generateId(),
      userId,
      product,
      quantity,
      total,
    };

    orders.push(order);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
};
