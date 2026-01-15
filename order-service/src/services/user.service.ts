import { httpClient } from "../utils/httpClient";
import { env } from "../config/env";

export interface User {
  id: string;
  name: string;
  role: string;
}

export const getUserById = async (id: string): Promise<User> => {
  const response = await httpClient.get<User>(
    `${env.USER_SERVICE_URL}/api/users/${id}`
  );

  return response.data;
};
