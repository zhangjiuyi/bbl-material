"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ShaderMaterial,
  Color3,
} from "@babylonjs/core";

// 脉冲扫描方向类型
export type PulseDirection = 
  | "left-to-right" 
  | "right-to-left" 
  | "top-to-bottom" 
  | "bottom-to-top"
  | "center-out"
  | "edges-in";

// 能量脉冲参数接口
interface EnergyPulseParams {
  color: string;           // 脉冲颜色（十六进制）
  speed: number;           // 脉冲速度
  width: number;           // 脉冲宽度
  glowIntensity: number;   // 发光强度
  direction: PulseDirection; // 脉冲方向
  trailGrid: boolean;      // 是否显示拖尾网格
  gridDensity: number;     // 网格密度
  gridBrightness: number;  // 网格亮度
}

interface EnergyPulseViewerProps {
  params: EnergyPulseParams;
}

// ==================== 顶点着色器 ====================
// 处理顶点位置变换，传递法线、位置、UV等数据给片段着色器
const vertexShader = `
  precision highp float;
  
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  
  uniform mat4 worldViewProjection;
  uniform mat4 world;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUV;
  varying vec3 vLocalPosition;
  
  void main() {
    vNormal = normalize((world * vec4(normal, 0.0)).xyz);
    vPosition = (world * vec4(position, 1.0)).xyz;
    vLocalPosition = position;
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;

// ==================== 片段着色器 ====================
// 实现能量脉冲效果：超细亮线 + 平滑渐变拖尾 + 网格纹理
const fragmentShader = `
  precision highp float;
  
  // Uniform 变量 - 从 JavaScript 传入
  uniform float time;           // 动画时间
  uniform vec3 pulseColor;      // 脉冲颜色
  uniform float pulseWidth;     // 脉冲宽度
  uniform float glowIntensity;  // 发光强度
  uniform int direction;        // 方向 (0=左→右, 1=右→左, 2=上→下, 3=下→上, 4=中→外, 5=外→中)
  uniform bool trailGrid;       // 是否显示拖尾网格
  uniform float gridDensity;    // 网格密度
  uniform float gridBrightness; // 网格亮度
  
  // Varying 变量 - 从顶点着色器接收
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUV;
  varying vec3 vLocalPosition;
  
  // 高斯衰减函数 - 用于平滑的光晕效果
  float gaussianFalloff(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
  }
  
  void main() {
    // 基础颜色（深色金属感）
    vec3 baseColor = vec3(0.02, 0.02, 0.03);
    
    // ========== 计算扫描位置 ==========
    // 根据方向计算当前像素在扫描轴上的位置
    // 注意：mesh 尺寸为 3x1.5x1.5，x 范围 -1.5 到 1.5
    float pos;
    float scanPos;
    float cycleTime = fract(time * 0.35);  // 循环时间 0~1
    
    if (direction == 0) {        // 左→右
      pos = (vLocalPosition.x + 1.5) / 3.0;
      scanPos = cycleTime;
    } else if (direction == 1) { // 右→左
      pos = 1.0 - (vLocalPosition.x + 1.5) / 3.0;
      scanPos = cycleTime;
    } else if (direction == 2) { // 上→下
      pos = 1.0 - (vLocalPosition.y + 0.75) / 1.5;
      scanPos = cycleTime;
    } else if (direction == 3) { // 下→上
      pos = (vLocalPosition.y + 0.75) / 1.5;
      scanPos = cycleTime;
    } else if (direction == 4) { // 中→外
      pos = abs(vLocalPosition.x) / 1.5;
      scanPos = cycleTime;
    } else {                     // 外→中
      pos = 1.0 - abs(vLocalPosition.x) / 1.5;
      scanPos = cycleTime;
    }
    
    // 当前像素到脉冲前沿的距离
    float distToFront = pos - scanPos;
    
    // ========== 统一连续效果 ==========
    float brightness = 0.0;
    
    // 拖尾区域（在扫描线后方）
    float trailGridEffect = 0.0;
    if (distToFront <= 0.0) {
      float d = -distToFront;
      
      // 平滑指数衰减 - 形成自然的拖尾效果
      brightness = exp(-d * 3.0);
      
      // 拖尾网格纹理 - 随距离渐变消失
      if (trailGrid) {
        float gx = abs(sin(vLocalPosition.x * gridDensity));
        float gy = abs(sin(vLocalPosition.y * gridDensity));
        float gz = abs(sin(vLocalPosition.z * gridDensity));
        
        // 创建细网格线（0.975→1.0 比 0.95→1.0 细一半）
        float gridLine = max(max(
          smoothstep(0.975, 1.0, gx),
          smoothstep(0.975, 1.0, gy)
        ), smoothstep(0.975, 1.0, gz));
        
        // 网格随拖尾距离衰减，亮度由 gridBrightness 控制
        trailGridEffect = gridLine * brightness * gridBrightness;
      }
    }
    
    // 极细亮峰 - 脉冲前沿的激光线效果
    float peakWidth = 0.003;
    float peak = exp(-(distToFront * distToFront) / (2.0 * peakWidth * peakWidth));
    brightness += peak * 1.5;
    
    // 总亮度 = 脉冲亮度 + 网格效果
    float totalBrightness = brightness + trailGridEffect;
    
    // ========== 柔和光晕 ==========
    // 脉冲周围的扩散光效
    float bloomWidth = pulseWidth * 4.0;
    float bloom = gaussianFalloff(distToFront, bloomWidth) * 0.15;
    
    // ========== 背景网格 ==========
    // 立方体表面的科技感网格（常驻，非拖尾网格）
    float gridX = smoothstep(0.97, 1.0, abs(sin(vLocalPosition.x * 25.0)));
    float gridY = smoothstep(0.97, 1.0, abs(sin(vLocalPosition.y * 25.0)));
    float gridZ = smoothstep(0.97, 1.0, abs(sin(vLocalPosition.z * 25.0)));
    float grid = max(max(gridX, gridY), gridZ) * 0.04;
    
    // 脉冲经过时网格变亮
    float gridPulse = gaussianFalloff(distToFront + 0.1, 0.15) * 0.1;
    
    // ========== 边缘高亮 ==========
    // 立方体边缘的发光效果
    vec3 absPos = abs(vLocalPosition);
    float edgeDist = min(
      min(abs(absPos.x - 0.75), abs(absPos.y - 0.75)),
      abs(absPos.z - 0.75)
    );
    float edgeHighlight = exp(-edgeDist * 15.0) * 0.15;
    
    // 边缘随脉冲发光
    float edgePulse = gaussianFalloff(distToFront + 0.15, 0.2) * edgeHighlight * 1.5;
    
    // ========== 边缘光 (Rim Lighting) ==========
    // 轮廓边缘的菲涅尔效果
    float rim = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    rim = pow(rim, 3.0) * 0.25;
    
    // ========== 混合所有效果 ==========
    vec3 finalColor = baseColor;
    
    // 主脉冲效果
    finalColor += pulseColor * totalBrightness * glowIntensity;
    finalColor += pulseColor * bloom * glowIntensity * 0.5;
    
    // 环境效果（较弱）
    finalColor += pulseColor * (grid + gridPulse) * 0.5;
    finalColor += pulseColor * (edgeHighlight + edgePulse) * 0.5;
    finalColor += pulseColor * rim * 0.2;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ==================== React 组件 ====================
export function EnergyPulseViewer({ params }: EnergyPulseViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const [fps, setFps] = useState(0);

  // 十六进制颜色转 RGB
  const hexToRgb = useCallback((hex: string): Color3 => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return new Color3(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      );
    }
    return new Color3(0, 1, 1);
  }, []);

  // 方向字符串转整数（用于 shader）
  const directionToInt = useCallback((dir: PulseDirection): number => {
    const map: Record<PulseDirection, number> = {
      "left-to-right": 0,
      "right-to-left": 1,
      "top-to-bottom": 2,
      "bottom-to-top": 3,
      "center-out": 4,
      "edges-in": 5,
    };
    return map[dir];
  }, []);

  // 参数变化时更新 shader uniform
  useEffect(() => {
    if (materialRef.current) {
      const color = hexToRgb(params.color);
      materialRef.current.setColor3("pulseColor", color);
      materialRef.current.setFloat("pulseWidth", params.width);
      materialRef.current.setFloat("glowIntensity", params.glowIntensity);
      materialRef.current.setInt("direction", directionToInt(params.direction));
      materialRef.current.setInt("trailGrid", params.trailGrid ? 1 : 0);
      materialRef.current.setFloat("gridDensity", params.gridDensity);
      materialRef.current.setFloat("gridBrightness", params.gridBrightness);
    }
  }, [params, hexToRgb, directionToInt]);

  // 初始化 Babylon.js 场景
  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建渲染引擎
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    // 创建场景
    const scene = new Scene(engine);
    scene.clearColor.set(0.02, 0.02, 0.03, 1);

    // 创建弧形旋转相机
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 3,
      4,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.1;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 10;

    // 创建半球光
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // 创建长方体 mesh（宽度是高度的2倍）
    const box = MeshBuilder.CreateBox(
      "box",
      { width: 3, height: 1.5, depth: 1.5 },
      scene
    );

    // 创建自定义 shader 材质
    const shaderMaterial = new ShaderMaterial(
      "energyPulse",
      scene,
      {
        vertexSource: vertexShader,
        fragmentSource: fragmentShader,
      },
      {
        attributes: ["position", "normal", "uv"],
        uniforms: [
          "worldViewProjection",
          "world",
          "time",
          "pulseColor",
          "pulseWidth",
          "glowIntensity",
          "direction",
          "trailGrid",
          "gridDensity",
          "gridBrightness",
        ],
      }
    );

    // 设置初始 uniform 值
    const color = hexToRgb(params.color);
    shaderMaterial.setColor3("pulseColor", color);
    shaderMaterial.setFloat("pulseWidth", params.width);
    shaderMaterial.setFloat("glowIntensity", params.glowIntensity);
    shaderMaterial.setInt("direction", directionToInt(params.direction));
    shaderMaterial.setInt("trailGrid", params.trailGrid ? 1 : 0);
    shaderMaterial.setFloat("gridDensity", params.gridDensity);
    shaderMaterial.setFloat("gridBrightness", params.gridBrightness);

    box.material = shaderMaterial;
    materialRef.current = shaderMaterial;

    // 动画时间变量
    let time = 0;

    // 渲染循环
    engine.runRenderLoop(() => {
      time += engine.getDeltaTime() / 1000 * params.speed;
      shaderMaterial.setFloat("time", time);
      scene.render();
      setFps(Math.round(engine.getFps()));
    });

    // 窗口大小变化处理
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, [hexToRgb, directionToInt, params.color, params.width, params.glowIntensity, params.direction, params.speed]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none outline-none"
      />
      {/* FPS 计数器 */}
      <div className="absolute right-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 font-mono text-sm text-green-400 backdrop-blur-sm">
        {fps} FPS
      </div>
    </>
  );
}
