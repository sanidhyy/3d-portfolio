import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";

import { useInView } from "../../hooks/use-in-view";
import CanvasLoader from "../loader";

type ComputersProps = {
  isMobile: boolean;
};

const Computers = ({ isMobile }: ComputersProps) => {
  const computer = useGLTF("./desktop_pc/scene.gltf");

  return (
    <mesh>
      <hemisphereLight intensity={0.15} groundColor="black" />
      <pointLight intensity={1} />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow={!isMobile}
        shadow-mapSize={1024}
      />
      <primitive
        object={computer.scene}
        scale={isMobile ? 0.5 : 0.75}
        position={isMobile ? [-4, -2, -2.5] : [0, -3.25, -1.5]}
        rotation={[-0.01, -0.2, -0.1]}
      />
    </mesh>
  );
};

const ComputersCanvas = () => {
  const { ref, isInView } = useInView({ initialVisible: true });
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    setIsMobile(mediaQuery.matches);

    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  useEffect(() => {
    if (isInView) setContextLost(false);
  }, [isInView]);

  return (
    <div
      ref={ref}
      className="hero-computer-canvas absolute inset-0 z-0 pointer-events-none md:pointer-events-auto"
    >
      {isInView && !contextLost && (
        <Canvas
          frameloop="demand"
          shadows={!isMobile}
          dpr={isMobile ? 1 : [1, 2]}
          camera={{ position: [20, 3, 5], fov: 25 }}
          gl={{
            preserveDrawingBuffer: !isMobile,
            alpha: true,
            antialias: !isMobile,
            powerPreference: isMobile ? "low-power" : "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.domElement.addEventListener(
              "webglcontextlost",
              (event) => {
                event.preventDefault();
                setContextLost(true);
              },
              { once: true },
            );
          }}
          style={{
            background: "transparent",
            touchAction: "pan-y",
            pointerEvents: isMobile ? "none" : "auto",
          }}
        >
          <Suspense fallback={<CanvasLoader />}>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={!isMobile}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 2}
            />
            <Computers isMobile={isMobile} />
          </Suspense>

          <Preload all />
        </Canvas>
      )}
    </div>
  );
};

export default ComputersCanvas;
