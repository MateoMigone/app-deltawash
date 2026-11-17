"use client";

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: "default" | "giantPlate";
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      variant = "default",
      leftIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const baseStyles =
      "w-full transition-all duration-150 focus:outline-none disabled:opacity-50";

    const variantStyles =
      variant === "giantPlate"
        ? "bg-slate-900 border-2 border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl py-5 px-4 text-center text-4xl sm:text-5xl font-black tracking-[0.2em] uppercase text-white placeholder:text-slate-700 placeholder:tracking-normal placeholder:font-bold"
        : `bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl py-3 ${
            leftIcon ? "pl-11 pr-4" : "px-4"
          } text-base text-slate-100 placeholder:text-slate-500`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && variant === "default" && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            suppressHydrationWarning
            className={`${baseStyles} ${variantStyles} ${
              error ? "border-rose-500 focus:border-rose-500" : ""
            } ${className}`}
            {...props}
          />
        </div>

        {helperText && !error && (
          <p className="text-xs text-slate-400">{helperText}</p>
        )}

        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
