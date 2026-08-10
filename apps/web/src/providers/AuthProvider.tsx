"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: string;
  roles: string[];
};

interface AuthContextType {
  user: User | null;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null,
  updateUser: () => {} 
});

export function AuthProvider({
  user: initialUser,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider value={{ user, updateUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
