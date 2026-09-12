import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

function EditorialSection() {
  const navigate = useNavigate();

  return (
    <section className="editorial-section">
      <div className="editorial-container">
        {/* Image */}
        <motion.div
          className="editorial-image"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <img src="/editorial/editorial-01.jpg" alt="Auren editorial" />

          <span className="editorial-image-label">AUREN / 02</span>
        </motion.div>

        {/* Content */}
        <motion.div
          className="editorial-content"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.9,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <p className="section-eyebrow">02 / THE AUREN APPROACH</p>

          <h2>
            Designed
            <span>with intention.</span>
          </h2>

          <p className="editorial-description">
            We believe the objects that surround us should feel considered,
            purposeful, and quietly distinctive. Every Auren piece is shaped by
            a balance of refined materials, thoughtful proportions, and enduring
            simplicity.
          </p>

          <button
            className="editorial-link"
            onClick={() => navigate("/collections")}
          >
            Discover our story
            <span>↗</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export default EditorialSection;
