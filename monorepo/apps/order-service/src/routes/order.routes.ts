import { Router } from 'express';
import { getOrders, createOrder } from '../controllers/order.controller';

export const orderRouter = Router();

orderRouter.get('/', getOrders);
orderRouter.post('/', createOrder);
