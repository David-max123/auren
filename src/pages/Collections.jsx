import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

function Collections() {
  const navigate = useNavigate();

  const collections = [
    {
      number: "01",
      name: "Signature Objects",
      description:
        "Distinctive pieces defined by refined proportions, tactile materials, and quiet presence.",
      image: "/products/product-01.jpg",
    },
    {
      number: "02",
      name: "Home Essentials",
      description:
        "Thoughtfully designed essentials created to bring simplicity and character to everyday spaces.",
      image: "/products/product-02.jpg",
    },
    {
      number: "03",
      name: "Everyday Forms",
      description:
        "Functional objects shaped around the rituals, routines, and moments that make up modern life.",
      image: "/products/product-03.jpg",
    },
  ];

  return (
    <main className="collections-page">
      {/* Intro */}
      <section className="collections-intro">
        <div className="container">
          <motion.div
            className="collections-intro-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="section-eyebrow">
              AUREN / COLLECTIONS
            </p>

            <h1>
              Objects with
              <span>intention.</span>
            </h1>

            <p>
              Explore the collections that define Auren — considered
              objects designed to exist naturally within the spaces
              and rituals of everyday life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collections */}
      <section className="collections-list">
        <div className="container">
          {collections.map((collection, index) => (
            <motion.article
              className={`collection-block ${
                index % 2 !== 0 ? "reverse" : ""
              }`}
              key={collection.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="collection-image">
                <img
                  src={collection.image}
                  alt={collection.name}
                />

                <span className="collection-image-number">
                  {collection.number}
                </span>
              </div>

              <div className="collection-content">
                <div>
                  <p className="section-eyebrow">
                    COLLECTION / {collection.number}
                  </p>

                  <h2>{collection.name}</h2>

                  <p>{collection.description}</p>
                </div>

                <button
                  onClick={() => navigate("/shop")}
                >
                  Explore collection
                  <span>↗</span>
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Closing Statement */}
      <section className="collections-statement">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.8,
            }}
          >
            <p className="section-eyebrow">
              AUREN / PHILOSOPHY
            </p>

            <h2>
              Less, but
              <span>better.</span>
            </h2>

            <button
              onClick={() => navigate("/shop")}
            >
              Shop all objects
              <span>↗</span>
            </button>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default Collections;



