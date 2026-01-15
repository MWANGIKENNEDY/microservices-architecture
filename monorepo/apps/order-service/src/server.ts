import express from 'express';
import dotenv from 'dotenv';
import { orderRouter } from './routes/order.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/orders', orderRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
