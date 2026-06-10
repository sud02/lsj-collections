"use client";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, leftIcon, rightSlot, required, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wide"
          >
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              "w-full h-12 px-4 bg-gray-light border border-border rounded",
              "text-dark placeholder:text-gray-mid",
              "focus:outline-none focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20",
              "transition-all duration-200",
              leftIcon && "pl-10",
              rightSlot && "pr-24",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          {rightSlot && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {!error && hint && <p className="text-xs text-gray mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
