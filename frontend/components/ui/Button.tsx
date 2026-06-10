"use client";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "dark" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gold text-white hover:bg-gold-dark hover:-translate-y-0.5 hover:shadow-md",
  outline:
    "border border-gold text-gold hover:bg-gold hover:text-white hover:-translate-y-0.5 hover:shadow-md",
  dark: "bg-dark text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-md",
  ghost: "text-dark hover:bg-gold-bg",
  danger: "bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-[50px] px-8 text-base",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium tracking-wide",
        "transition-all duration-200 active:translate-y-0",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
);

Button.displayName = "Button";
export default Button;
