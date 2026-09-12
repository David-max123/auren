import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

function CampaignSection() {
    const navigate = useNavigate();

  return (
    <section className="campaign-section">
      {/* Background Image */}
      {/* Background Image */}
      <div className="campaign-image">
        <img src="/products/product-02.jpg" alt="Auren No. 02" />
      </div>

      {/* Dark Overlay */}
      <div className="campaign-overlay" />

      {/* Content */}
      <motion.div
        className="campaign-content"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <p className="campaign-eyebrow">AUREN / AUTUMN 2026</p>

        <h2>
          Made for
          <span>the everyday.</span>
        </h2>

        <p className="campaign-description">
          Objects with presence, designed to become part of the spaces and
          rituals that matter most.
        </p>

        <button
          className="campaign-button"
          onClick={() => navigate("/collections")}
        >
          Explore the collection
          <span>↗</span>
        </button>
      </motion.div>

      {/* Section Index */}
      <span className="campaign-index">04 / 04</span>
    </section>
  );
}

export default CampaignSection;



