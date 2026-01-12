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

// 扫描光参数接口
interface ScanLightParams {
  color: string;    // 扫描光颜色（十六进制）
  speed: number;    // 扫描速度
  width: number;    // 扫描光宽度
  direction: "clockwise" | "counterclockwise";  // 扫描方向
}

interface EffectViewerProps {
  params: ScanLightParams;
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
  
  void main() {
    vNormal = normalize((world * vec4(normal, 0.0)).xyz);
    vPosition = (world * vec4(position, 1.0)).xyz;
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
  }
`;

// ==================== 片段着色器 ====================
// 实现雷达扫描效果：旋转扫描线 + 网格纹理 + 边缘光
const fragmentShader = `
  precision highp float;
  
  // Uniform 变量 - 从 JavaScript 传入
  uniform float time;       // 动画时间
  uniform vec3 scanColor;   // 扫描光颜色
  uniform float scanWidth;  // 扫描光宽度
  uniform float direction;  // 方向 (1.0=顺时针, -1.0=逆时针)
  
  // Varying 变量 - 从顶点着色器接收
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUV;
  
  void main() {
    // 基础球体颜色（深色）
    vec3 baseColor = vec3(0.08, 0.08, 0.12);
    
    // 计算雷达扫描角度（从中心点计算）
    float angle = atan(vPosition.x, vPosition.z);
    float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);  // 归一化到 0~1
    
    // 扫描线位置动画
    float scanPos = fract(time * 0.3 * direction);
    
    // 计算到扫描线的距离（处理环绕情况）
    float dist1 = abs(normalizedAngle - scanPos);
    float dist2 = abs(normalizedAngle - scanPos + 1.0);
    float dist3 = abs(normalizedAngle - scanPos - 1.0);
    float dist = min(min(dist1, dist2), dist3);
    
    // 创建平滑衰减的扫描线
    float scanIntensity = smoothstep(scanWidth, 0.0, dist);
    
    // 添加明亮的前沿边缘
    float edgeIntensity = smoothstep(scanWidth * 0.3, 0.0, dist) * 2.0;
    
    // 添加经度网格线
    float gridX = smoothstep(0.98, 1.0, abs(sin(vPosition.x * 20.0)));
    float gridZ = smoothstep(0.98, 1.0, abs(sin(vPosition.z * 20.0)));
    float grid = max(gridX, gridZ) * 0.15;
    
    // 添加纬度线
    float latLines = smoothstep(0.97, 1.0, abs(sin(vPosition.y * 15.0))) * 0.2;
    
    // 混合所有效果
    vec3 finalColor = baseColor;
    finalColor += scanColor * scanIntensity * 0.8;  // 扫描光主体
    finalColor += scanColor * edgeIntensity;         // 明亮前沿
    finalColor += scanColor * grid;                  // 经度网格
    finalColor += scanColor * latLines * 0.5;        // 纬度线
    
    // 添加边缘光（菲涅尔效果）
    float rim = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    rim = pow(rim, 3.0);
    finalColor += scanColor * rim * 0.3;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ==================== React 组件 ====================
export function EffectViewer({ params }: EffectViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
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

  // 参数变化时更新 shader uniform
  useEffect(() => {
    if (materialRef.current) {
      const color = hexToRgb(params.color);
      materialRef.current.setColor3("scanColor", color);
      materialRef.current.setFloat("scanWidth", params.width);
      materialRef.current.setFloat(
        "direction",
        params.direction === "clockwise" ? 1.0 : -1.0
      );
    }
  }, [params, hexToRgb]);

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
    scene.clearColor.set(0.05, 0.05, 0.08, 1);
    sceneRef.current = scene;

    // 创建弧形旋转相机
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 3,
      5,
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

    // 创建球体 mesh
    const sphere = MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 2, segments: 32 },
      scene
    );

    // 创建自定义 shader 材质
    const shaderMaterial = new ShaderMaterial(
      "scanLight",
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
          "scanColor",
          "scanWidth",
          "direction",
        ],
      }
    );

    // 设置初始 uniform 值
    const color = hexToRgb(params.color);
    shaderMaterial.setColor3("scanColor", color);
    shaderMaterial.setFloat("scanWidth", params.width);
    shaderMaterial.setFloat(
      "direction",
      params.direction === "clockwise" ? 1.0 : -1.0
    );

    sphere.material = shaderMaterial;
    materialRef.current = shaderMaterial;

    // 动画时间变量
    let time = 0;
    const speed = params.speed;

    // 渲染循环
    engine.runRenderLoop(() => {
      time += engine.getDeltaTime() / 1000 * speed;
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
  }, [hexToRgb, params.color, params.direction, params.speed, params.width]);

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
