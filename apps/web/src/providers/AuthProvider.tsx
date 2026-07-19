"use client";

import React, { createContext, useContext, ReactNode } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
};

interface AuthContextType {
  user: User | null;
}

const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
