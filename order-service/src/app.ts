import express from "express";
import orderRoutes from "./routes/order.routes";

export const app = express();

app.use(express.json());
app.use("/api/orders", orderRoutes);
