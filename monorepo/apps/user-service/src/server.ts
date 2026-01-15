import express from 'express';
import dotenv from 'dotenv';
import { userRouter } from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
app.use('/users', userRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
