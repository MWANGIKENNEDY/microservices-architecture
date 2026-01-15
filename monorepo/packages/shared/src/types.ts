export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  userId: string;
  product: string;
  quantity: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
