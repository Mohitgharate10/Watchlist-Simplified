import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  setAuthTokenGetter,
  useGetCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize token getter for customFetch
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading, refetch } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
      refetch();
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [token, refetch]);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await loginMutation.mutateAsync({
      data: { usernameOrEmail, password },
    });
    setToken(res.token);
    localStorage.setItem("auth_token", res.token);
    await queryClient.invalidateQueries();
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await registerMutation.mutateAsync({
      data: { username, email, password },
    });
    setToken(res.token);
    localStorage.setItem("auth_token", res.token);
    await queryClient.invalidateQueries();
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore logout errors
    }
    setToken(null);
    localStorage.removeItem("auth_token");
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user: token && currentUser ? currentUser : null,
        isLoading: !!token && isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
