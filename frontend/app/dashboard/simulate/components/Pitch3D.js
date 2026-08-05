"use client";
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

const Field = () => {
  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110, 70]} />
        <meshStandardMaterial color="#2d5e1e" roughness={0.8} />
      </mesh>
      
      {/* Outer Lines */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 64]} />
        <meshBasicMaterial color="white" wireframe />
      </mesh>

      {/* Center Circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.15, 9.3, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Center Line */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 64]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Penalty Boxes */}
      <mesh position={[-41.75, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16.5, 40]} />
        <meshBasicMaterial color="white" wireframe />
      </mesh>
      <mesh position={[41.75, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16.5, 40]} />
        <meshBasicMaterial color="white" wireframe />
      </mesh>

      {/* Goals */}
      {/* Home Goal */}
      <group position={[-50.5, 1.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 2.4, 7.32]} />
          <meshStandardMaterial color="white" wireframe />
        </mesh>
      </group>
      {/* Away Goal */}
      <group position={[50.5, 1.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 2.4, 7.32]} />
          <meshStandardMaterial color="white" wireframe />
        </mesh>
      </group>
    </group>
  );
};

const Ball = ({ targetPosition }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // Lerp ball to target position smoothly
    if (meshRef.current && targetPosition) {
      // Map 0-100 x/y to -50 to 50 x and -35 to 35 z
      const targetX = (targetPosition.x - 50);
      const targetZ = (targetPosition.y - 50) * 0.7; // scaled for pitch width
      
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.1);
      
      // Add some bounce if moving
      const dist = Math.abs(targetX - meshRef.current.position.x) + Math.abs(targetZ - meshRef.current.position.z);
      if (dist > 1) {
         meshRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 2 + 0.5;
         meshRef.current.rotation.x += delta * 10;
         meshRef.current.rotation.z += delta * 10;
      } else {
         meshRef.current.position.y = 0.5;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="white" roughness={0.2} metalness={0.1} />
    </mesh>
  );
};

export default function Pitch3D({ ballPos }) {
  return (
    <div className="w-full h-[400px] bg-sky-900 rounded-xl overflow-hidden border border-[var(--border-color)]">
      <Canvas shadows camera={{ position: [0, 30, 40], fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 50, 20]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        
        <Field />
        <Ball targetPosition={ballPos} />
        
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={110} blur={2} far={10} />
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={10} 
          maxDistance={80} 
        />
      </Canvas>
      <div className="absolute top-2 left-2 text-xs font-bold text-white/50 bg-black/50 px-2 py-1 rounded">
        Drag to Rotate | Scroll to Zoom
      </div>
    </div>
  );
}
