"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { EnergyPulseViewer, PulseDirection } from "@/components/energy-pulse-viewer";

export default function EnergyPulsePage() {
  const router = useRouter();
  const [params, setParams] = useState({
    color: "#00ffaa",
    speed: 1,
    width: 0.03,
    glowIntensity: 1.5,
    direction: "left-to-right" as PulseDirection,
    trailGrid: true,
    gridDensity: 20,
    gridBrightness: 0.4,
  });

  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const colorPresets = [
    { name: "电能绿", value: "#00ffaa" },
    { name: "电浆蓝", value: "#00aaff" },
    { name: "能量紫", value: "#aa55ff" },
    { name: "警示橙", value: "#ff8800" },
    { name: "充能红", value: "#ff3366" },
  ];

  const directions: { value: PulseDirection; label: string }[] = [
    { value: "left-to-right", label: "左→右" },
    { value: "right-to-left", label: "右→左" },
    { value: "top-to-bottom", label: "上→下" },
    { value: "bottom-to-top", label: "下→上" },
    { value: "center-out", label: "中→外" },
    { value: "edges-in", label: "外→中" },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* BabylonJS Canvas */}
      <div className="absolute inset-0">
        <EnergyPulseViewer params={params} />
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/")}
        className="absolute left-4 top-4 z-10 border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-white/10"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        返回
      </Button>

      {/* Toggle panel button (mobile) */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute bottom-4 right-4 z-20 border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-white/10 md:hidden"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </Button>

      {/* Control Panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transform transition-transform duration-300 md:bottom-auto md:right-4 md:left-auto md:top-1/2 md:-translate-y-1/2 md:w-80 ${
          isPanelOpen ? "translate-y-0" : "translate-y-full md:translate-y-[-50%]"
        }`}
      >
        <div className="rounded-t-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl md:rounded-2xl">
          <h2 className="mb-6 text-lg font-semibold text-white">参数控制</h2>

          {/* Color selection */}
          <div className="mb-6">
            <Label className="mb-3 block text-sm text-white/70">脉冲颜色</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setParams((p) => ({ ...p, color: preset.value }))}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    params.color === preset.value
                      ? "border-white scale-110"
                      : "border-transparent hover:border-white/50"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
              <input
                type="color"
                value={params.color}
                onChange={(e) =>
                  setParams((p) => ({ ...p, color: e.target.value }))
                }
                className="h-8 w-8 cursor-pointer rounded-full border-2 border-dashed border-white/30"
              />
            </div>
          </div>

          {/* Direction selection */}
          <div className="mb-6">
            <Label className="mb-3 block text-sm text-white/70">脉冲方向</Label>
            <div className="grid grid-cols-3 gap-2">
              {directions.map((dir) => (
                <Button
                  key={dir.value}
                  variant={params.direction === dir.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setParams((p) => ({ ...p, direction: dir.value }))}
                  className={
                    params.direction === dir.value
                      ? ""
                      : "border-white/20 bg-transparent text-white hover:bg-white/10"
                  }
                >
                  {dir.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Speed control */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm text-white/70">脉冲速度</Label>
              <span className="text-sm text-white">{params.speed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[params.speed]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, speed: value }))
              }
              min={0.2}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Width control */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm text-white/70">脉冲宽度</Label>
              <span className="text-sm text-white">
                {(params.width * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[params.width]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, width: value }))
              }
              min={0.02}
              max={0.2}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Glow intensity control */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm text-white/70">发光强度</Label>
              <span className="text-sm text-white">
                {params.glowIntensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[params.glowIntensity]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, glowIntensity: value }))
              }
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Trail grid toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white/70">拖尾网格</Label>
              <button
                onClick={() => setParams((p) => ({ ...p, trailGrid: !p.trailGrid }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  params.trailGrid ? "bg-primary" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    params.trailGrid ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Grid density control */}
          {params.trailGrid && (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm text-white/70">网格密度</Label>
                <span className="text-sm text-white">
                  {params.gridDensity.toFixed(0)}
                </span>
              </div>
              <Slider
                value={[params.gridDensity]}
                onValueChange={([value]) =>
                  setParams((p) => ({ ...p, gridDensity: value }))
                }
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Grid brightness control */}
          {params.trailGrid && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm text-white/70">网格亮度</Label>
                <span className="text-sm text-white">
                  {(params.gridBrightness * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[params.gridBrightness]}
                onValueChange={([value]) =>
                  setParams((p) => ({ ...p, gridBrightness: value }))
                }
                min={0.1}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
