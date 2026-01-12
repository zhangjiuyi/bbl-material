"use client";

import Link from "next/link";

interface EffectCardProps {
  title: string;
  description: string;
  href: string;
  gradient?: string;
}

export function EffectCard({ 
  title, 
  description, 
  href, 
  gradient = "from-purple-500/20 via-blue-500/20 to-cyan-500/20" 
}: EffectCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:shadow-[0_0_30px_oklch(0.7_0.15_280/0.3)]">
        {/* 预览区域 - 渐变动画背景 */}
        <div className={`relative h-48 w-full bg-gradient-to-br ${gradient} animate-gradient overflow-hidden`}>
          {/* 扫描线动画效果 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute h-full w-1 bg-gradient-to-b from-transparent via-white/40 to-transparent opacity-0 group-hover:animate-[scan_2s_ease-in-out_infinite] group-hover:opacity-100" 
                 style={{ 
                   animation: 'none',
                 }} 
            />
          </div>
          {/* 中心图标指示器 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-white/40 group-hover:bg-white/10">
              <div className="flex h-full w-full items-center justify-center">
                <svg className="h-8 w-8 text-white/60 transition-colors group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
