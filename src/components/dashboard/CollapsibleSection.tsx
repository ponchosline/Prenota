"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  headerRight,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      {/* Section header — tap to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h2 className="text-[18px] sm:text-[22px] font-bold tracking-tight text-[var(--color-label-primary)] text-left">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[12px] sm:text-[13px] text-[var(--color-label-tertiary)] mt-0.5 text-left">
                {subtitle}
              </p>
            )}
          </div>
          {/* Chevron */}
          <div
            className={`w-6 h-6 rounded-full bg-[#78788018] flex items-center justify-center shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-[var(--color-label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {headerRight && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
      </button>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? "max-h-[5000px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
