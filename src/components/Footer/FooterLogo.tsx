"use client";

import { useState } from "react";
import Image from "next/image";
import { Wrench } from "lucide-react";

interface FooterLogoProps {
  className?: string;
}

export default function FooterLogo({ className = "" }: FooterLogoProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <a
      href="https://hit-tool.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="HITtools ポータルサイトへ移動"
      className={`group inline-flex flex-col items-center transition hover:opacity-85 ${className}`}
    >
      {!hasError ? (
        <Image
          src="/logo.png"
          alt="HITtools"
          width={160}
          height={40}
          priority
          onError={() => setHasError(true)}
          className="h-8 w-auto mx-auto object-contain"
        />
      ) : (
        <div className="flex items-center gap-1.5 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-white shadow-xs">
            <Wrench size={15} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-800">
            HITtools
          </span>
        </div>
      )}
    </a>
  );
}
