import { EffectCard } from "@/components/effect-card";

const effects = [
  {
    title: "雷达扫光",
    description: "类似雷达扫描的动态光效，可自定义颜色、方向和扫描速度，适用于科技感UI和3D场景",
    href: "/effects/scan-light",
    gradient: "from-cyan-500/30 via-blue-500/20 to-purple-500/30",
  },
  {
    title: "能量脉冲",
    description: "线性扫光带发光拖尾效果，支持多方向流动，适用于充电动画、能量传输等科幻场景",
    href: "/effects/energy-pulse",
    gradient: "from-green-500/30 via-emerald-500/20 to-teal-500/30",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500" />
            <span className="text-xl font-bold tracking-tight">BBL Material</span>
          </div>
          <nav className="hidden md:block">
            <span className="text-sm text-muted-foreground">Shader 特效库</span>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-white/10 py-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Shader 特效库
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            基于 BabylonJS 构建的实时 Shader 特效集合，提供即时预览与参数调节
          </p>
        </div>
      </section>

      {/* Effects grid */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {effects.map((effect) => (
            <EffectCard key={effect.href} {...effect} />
          ))}
        </div>
        
        {/* Empty state hint */}
        {effects.length <= 2 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            更多特效即将推出...
          </p>
        )}
      </main>
    </div>
  );
}
