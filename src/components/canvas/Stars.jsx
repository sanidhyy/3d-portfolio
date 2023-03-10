import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload, Point } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";

// Stars
const Stars = (props) => {
  const ref = useRef();
  // For each star
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.2 });

  // Rotate multiple stars
  useFrame((_, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* Points */}
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        {/* Each point material */}
        <PointMaterial
          transparent
          color="#f272c8"
          size={0.002}
          sizeAttentuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

// Stars Canvas
const StarsCanvas = () => {
  return (
    <div className="w-full h-auto absolute inset-0 z-[-1]">
      {/* Canvas */}
      <Canvas camera={{ position: [0, 0, 1] }}>
        {/* Show stars if not fallback */}
        <Suspense fallback={null}>
          <Stars />
        </Suspense>

        {/* preload all */}
        <Preload all />
      </Canvas>
    </div>
  );
};

export default StarsCanvas;
