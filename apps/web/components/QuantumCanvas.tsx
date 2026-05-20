"use client";

import { useEffect, useRef } from "react";

export function QuantumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let disposed = false;

    (async () => {
      const THREE = await import("three");

      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      // ── Particle field ────────────────────────────────────
      const count = 6000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const colorA = new THREE.Color("#7c6cf8");
      const colorB = new THREE.Color("#00e5ff");
      const colorC = new THREE.Color("#ffffff");

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        const t = Math.random();
        const col = t < 0.4 ? colorA : t < 0.7 ? colorB : colorC;
        const f = t < 0.7 ? 0.6 + Math.random() * 0.4 : 0.2 + Math.random() * 0.3;
        colors[i * 3]     = col.r * f;
        colors[i * 3 + 1] = col.g * f;
        colors[i * 3 + 2] = col.b * f;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);

      // ── Glow sphere ───────────────────────────────────────
      const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x7c6cf8,
        transparent: true,
        opacity: 0.04,
        wireframe: false,
      });
      scene.add(new THREE.Mesh(sphereGeo, sphereMat));

      // ── Wireframe icosahedron ─────────────────────────────
      const wireGeo = new THREE.IcosahedronGeometry(1.6, 2);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x7c6cf8,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      });
      const wireSphere = new THREE.Mesh(wireGeo, wireMat);
      scene.add(wireSphere);

      // ── Mouse parallax ────────────────────────────────────
      const mouse = { x: 0, y: 0 };
      const onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", onMouseMove);

      // ── Resize ───────────────────────────────────────────
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // ── Animation loop ────────────────────────────────────
      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.0008;
        points.rotation.y = t * 0.3;
        points.rotation.x = t * 0.1;
        wireSphere.rotation.y = -t * 0.5;
        wireSphere.rotation.x = t * 0.3;
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
        camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      };
      animate();

      // ── Cleanup ───────────────────────────────────────────
      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        geo.dispose();
        mat.dispose();
        sphereGeo.dispose();
        sphereMat.dispose();
        wireGeo.dispose();
        wireMat.dispose();
      };
    })().then((cleanup) => {
      if (disposed && cleanup) cleanup();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}
