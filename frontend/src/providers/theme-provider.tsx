"use client";

import React from "react";
import { ThemeProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ClientThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
