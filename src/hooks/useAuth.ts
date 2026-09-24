import { useAuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../types/auth';

export const useAuth = (): AuthContextType => {
  return useAuthContext();
};

export default useAuth;
