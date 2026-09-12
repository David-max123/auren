import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "motion/react";

import FeaturedCollection from "../components/FeaturedCollection";
import EditorialSection from "../components/EditorialSection";
import BestSellers from "../components/BestSellers";
import CampaignSection from "../components/CampaignSection";

function Home() {
  const navigate = useNavigate();
  const visualRef = useRef(null);

  /* -------------------------------------------------------
     HERO INTERACTION
     ------------------------------------------------------- */

  const rotateX = useMotionValue(5);
  const rotateY = useMotionValue(-10);

  const lightX = useMotionValue(0);
  const lightY = useMotionValue(0);

  const springRotateX = useSpring(rotateX, {
    stiffness: 90,
    damping: 22,
    mass: 0.8,
  });

  const springRotateY = useSpring(rotateY, {
    stiffness: 90,
    damping: 22,
    mass: 0.8,
  });

  const springLightX = useSpring(lightX, {
    stiffness: 70,
    damping: 22,
  });

  const springLightY = useSpring(lightY, {
    stiffness: 70,
    damping: 22,
  });

  const handleMouseMove = (event) => {
    if (!visualRef.current) return;

    const rect = visualRef.current.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const normalizedX = (x - centerX) / centerX;
    const normalizedY = (y - centerY) / centerY;

    rotateY.set(-10 + normalizedX * 10);
    rotateX.set(5 + normalizedY * -8);

    lightX.set(normalizedX * 55);
    lightY.set(normalizedY * 55);
  };

  const handleMouseLeave = () => {
    rotateX.set(5);
    rotateY.set(-10);

    lightX.set(0);
    lightY.set(0);
  };

  return (
    <div className="home">
      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <p className="hero-eyebrow">AUREN / AUTUMN 2026</p>

          <h1>
            The new standard
            <span>of everyday luxury.</span>
          </h1>

          <p className="hero-description">
            Thoughtfully designed essentials for modern living.
          </p>

          <button className="hero-button" onClick={() => navigate("/shop")}>
            Explore Collection
          </button>
        </motion.div>

        {/* ===================================================
            HERO VISUAL
            =================================================== */}

        <div
          ref={visualRef}
          className="hero-visual"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Ambient glow behind the sculpture */}

          <motion.div
            className="hero-atmosphere"
            style={{
              x: springLightX,
              y: springLightY,
            }}
          />

          {/* Main sculptural object */}

          <motion.div
            className="hero-sculpture"
            style={{
              rotateX: springRotateX,
              rotateY: springRotateY,
            }}
            animate={{
              y: [0, -14, 0],
            }}
            transition={{
              y: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            {/* Rear depth */}

            <div className="sculpture-back" />

            {/* Main body */}

            <div className="sculpture-body">
              <div className="sculpture-surface" />

              <motion.div
                className="sculpture-highlight"
                style={{
                  x: springLightX,
                  y: springLightY,
                }}
              />

              <div className="sculpture-shadow" />
            </div>

            {/* Upper architectural section */}

            <div className="sculpture-neck">
              <div className="sculpture-neck-inner" />
            </div>

            {/* Top cap */}

            <div className="sculpture-cap">
              <div className="sculpture-cap-highlight" />
            </div>

            {/* Tiny Auren engraving */}

            <div className="sculpture-mark">A</div>
          </motion.div>

          {/* Ground shadow */}

          <motion.div
            className="hero-ground-shadow"
            animate={{
              scaleX: [1, 0.92, 1],
              opacity: [0.45, 0.3, 0.45],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Depth-aware trajectory */}

          <svg
            className="hero-trajectory"
            viewBox="0 0 600 360"
            aria-hidden="true"
          >
            <defs>
              <filter id="orbitGlow">
                <feGaussianBlur stdDeviation="3" />
              </filter>

              <path
                id="heroOrbitPath"
                d="M 300 55
                C 435 55, 545 110, 545 180
                C 545 250, 435 305, 300 305
                C 165 305, 55 250, 55 180
                C 55 110, 165 55, 300 55 Z"
              />
            </defs>

            {/* soft glow */}
            <ellipse
              className="orbit-glow"
              cx="300"
              cy="180"
              rx="245"
              ry="125"
            />

            {/* visible orbit */}
            <use href="#heroOrbitPath" className="orbit-line" />

            {/* moving glow */}
            <circle className="trajectory-dot-glow" r="14">
              <animateMotion dur="8s" repeatCount="indefinite">
                <mpath href="#heroOrbitPath" />
              </animateMotion>
            </circle>

            {/* moving point */}
            <circle className="trajectory-dot" r="5">
              <animateMotion dur="8s" repeatCount="indefinite">
                <mpath href="#heroOrbitPath" />
              </animateMotion>
            </circle>
          </svg>

          {/* Small editorial label */}

          <span className="hero-floating-text">A / 01</span>

          <span className="hero-coordinate">09° 17′ 42″ N</span>
        </div>
      </section>

      {/* =====================================================
          HOMEPAGE SECTIONS
          ===================================================== */}

      <FeaturedCollection />

      <EditorialSection />

      <BestSellers />

      <CampaignSection />
    </div>
  );
}

export default Home;
