import axios from 'axios';

export const createHttpClient = (baseURL?: string, timeout: number = 3000) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const httpClient = createHttpClient();
