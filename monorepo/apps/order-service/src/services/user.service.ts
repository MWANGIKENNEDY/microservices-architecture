import { createHttpClient, User, ApiResponse } from '@monorepo/shared';

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4001';
const httpClient = createHttpClient(userServiceUrl);

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const response = await httpClient.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};
