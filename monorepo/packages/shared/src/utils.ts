export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
