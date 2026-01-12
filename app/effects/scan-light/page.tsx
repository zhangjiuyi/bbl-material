"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { EffectViewer } from "@/components/effect-viewer";

export default function ScanLightPage() {
  const router = useRouter();
  const [params, setParams] = useState({
    color: "#00ffff",
    speed: 1,
    width: 0.15,
    direction: "clockwise" as "clockwise" | "counterclockwise",
  });

  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const colorPresets = [
    { name: "青色", value: "#00ffff" },
    { name: "紫色", value: "#a855f7" },
    { name: "绿色", value: "#22c55e" },
    { name: "橙色", value: "#f97316" },
    { name: "粉色", value: "#ec4899" },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* BabylonJS Canvas */}
      <div className="absolute inset-0">
        <EffectViewer params={params} />
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
        className={`absolute bottom-0 left-0 right-0 z-10 transform transition-transform duration-300 md:bottom-auto md:right-4 md:left-auto md:top-1/2 md:-translate-y-1/2 md:w-72 ${
          isPanelOpen ? "translate-y-0" : "translate-y-full md:translate-y-[-50%]"
        }`}
      >
        <div className="rounded-t-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl md:rounded-2xl">
          <h2 className="mb-6 text-lg font-semibold text-white">参数控制</h2>

          {/* Color selection */}
          <div className="mb-6">
            <Label className="mb-3 block text-sm text-white/70">扫光颜色</Label>
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

          {/* Speed control */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm text-white/70">扫描速度</Label>
              <span className="text-sm text-white">{params.speed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[params.speed]}
              onValueChange={([value]) =>
                setParams((p) => ({ ...p, speed: value }))
              }
              min={0.1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Width control */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm text-white/70">扫光宽度</Label>
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
              max={0.4}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Direction control */}
          <div>
            <Label className="mb-3 block text-sm text-white/70">扫描方向</Label>
            <div className="flex gap-2">
              <Button
                variant={params.direction === "clockwise" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setParams((p) => ({ ...p, direction: "clockwise" }))
                }
                className={
                  params.direction === "clockwise"
                    ? "flex-1"
                    : "flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                }
              >
                顺时针
              </Button>
              <Button
                variant={
                  params.direction === "counterclockwise" ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setParams((p) => ({ ...p, direction: "counterclockwise" }))
                }
                className={
                  params.direction === "counterclockwise"
                    ? "flex-1"
                    : "flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                }
              >
                逆时针
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
