
import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 4001,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:4001"
};
