import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedSphere() {
  const sphereRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = clock.getElapsedTime() * 0.1
      sphereRef.current.rotation.y = clock.getElapsedTime() * 0.15
    }
  })

  return (
    <Sphere ref={sphereRef} args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color="#3b82f6"
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
        wireframe={true}
        transparent={true}
        opacity={0.15}
      />
    </Sphere>
  )
}

function FloatingParticles() {
  const points = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.05
      points.current.rotation.x = clock.getElapsedTime() * 0.02
    }
  })

  // Create random points for background dust
  const count = 500
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15 // Spread out over -7.5 to 7.5
  }

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#8b5cf6" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

export default function Background3D() {
  return (
    <div className="absolute inset-0 w-full h-full bg-dark-900 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={1} color="#8b5cf6" />
        <directionalLight position={[-2, -2, -2]} intensity={0.5} color="#3b82f6" />

        <AnimatedSphere />
        <FloatingParticles />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
      {/* Overlay gradient to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900/50 via-transparent to-dark-900/80" />
    </div>
  )
}
