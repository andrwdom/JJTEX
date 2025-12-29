"use client"

import Image from "next/image"
import logo from "@/public/logo1.png"

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col items-center justify-center overflow-hidden">
      {/* Premium Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-50/40 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Logo Container with Sophisticated Animation */}
      <div className="relative mb-12 group">
        {/* Soft Pulse Rings */}
        <div className="absolute inset-0 scale-150 bg-pink-100/50 rounded-full blur-2xl animate-ping opacity-20" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 scale-125 bg-pink-50 rounded-full blur-xl animate-pulse opacity-40" />
        
        <div className="relative transform transition-transform duration-1000 group-hover:scale-105">
          <Image
            src={logo}
            alt="JJTextiles Logo"
            width={160}
            height={160}
            className="h-24 w-auto object-contain drop-shadow-sm animate-fade-pulse"
            priority
          />
        </div>
      </div>

      {/* Elegant Loading Content */}
      <div className="relative text-center px-6">
        <div className="space-y-3">
          <p className="text-[#3b2b52] text-[13px] sm:text-[14px] font-bold tracking-[0.3em] uppercase font-serif animate-pulse">
            {message}
          </p>
          <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
            Premium Apparel & Textiles
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-8 w-40 h-[2px] bg-gray-50 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-200 via-pink-500 to-pink-200 w-full -translate-x-full animate-progress-slide" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-slide {
          animation: progress-slide 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  )
}
