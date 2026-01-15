import { findUserById } from "../repository/user.repository";


export const getUser = async (id: string) => {
  return findUserById(id);
};
