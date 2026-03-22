"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, ...props }, ref) => {
    return (
      <motion.button
        className={cn(
          "cyber-btn relative inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-wider disabled:pointer-events-none disabled:opacity-50",
          {
            // Variants - Silent Blade palette
            "border-[var(--color-primary)] text-[var(--color-secondary)] hover:border-[var(--color-secondary)] hover:text-white": variant === "primary",
            "border-[var(--color-success)] text-[var(--color-success)] hover:border-[var(--color-success-bright)] hover:text-white": variant === "success",
            "border-[var(--color-warning)] text-[var(--color-warning)] hover:border-[var(--color-warning-bright)] hover:text-white": variant === "warning",
            "border-[var(--color-danger)] text-[var(--color-danger)] hover:border-[var(--color-danger-light)] hover:text-white": variant === "danger",
            "border-transparent text-[var(--color-secondary)] hover:border-[var(--color-primary)]/30 hover:bg-[#0a0a14]/50": variant === "ghost",
            
            // Sizes
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            
            // Glow effect
            "neon-glow-cyan": glow && variant === "primary",
          },
          className
        )}
        whileHover={{ 
          y: -2,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        whileTap={{ 
          y: 0,
          transition: { duration: 0.1 }
        }}
        ref={ref}
        {...(props as any)}
      />
    );
  }
);

Button.displayName = "Button";
