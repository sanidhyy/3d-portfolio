import { Points, PointMaterial, Preload } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as random from "maath/random";
import { Suspense, useRef, useState, type ComponentRef } from "react";

import { useInView } from "../../hooks/use-in-view";

const Stars = () => {
  const ref = useRef<ComponentRef<typeof Points>>(null);
  const [sphere] = useState(() =>
    random.inSphere(new Float32Array(6000), { radius: 1.2 }),
  );

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={new Float32Array(sphere)}
        stride={3}
        frustumCulled
      >
        <PointMaterial
          transparent
          color="#f272c8"
          size={0.002}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsCanvas = () => {
  const { ref, isInView } = useInView();

  return (
    <div ref={ref} className="w-full h-auto absolute inset-0 z-[-1]">
      {isInView && (
        <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <Stars />
          </Suspense>

          <Preload all />
        </Canvas>
      )}
    </div>
  );
};

export default StarsCanvas;
