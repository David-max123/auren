import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";

function FeaturedCollection() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));

        const productList = productsSnapshot.docs.map((productDoc) => ({
          id: productDoc.id,
          ...productDoc.data(),
        }));

        // Show the first 4 real products from Firestore
        setProducts(productList.slice(3, 7));
      } catch (error) {
        console.error("Error loading featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <section className="featured-collection">
      <div className="featured-header">
        <div>
          <p className="featured-eyebrow">AUREN / COLLECTION 01</p>

          <h2>
            The essentials,
            <span>redefined.</span>
          </h2>
        </div>

        <motion.button
          className="featured-view-all"
          onClick={() => navigate("/shop")}
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>View all pieces</span>
          <span className="featured-arrow">→</span>
        </motion.button>
      </div>

      <div className="featured-grid">
        {loading ? (
          <div className="featured-loading">Loading collection...</div>
        ) : (
          products.map((product, index) => (
            <motion.article
              key={product.id}
              className={`featured-card featured-card-${index + 1}`}
              initial={{
                opacity: 0,
                y: 35,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="featured-image-wrap">
                <img
                  src={product.image}
                  alt={product.name}
                  className="featured-image"
                />

                <div className="featured-image-overlay" />

                <span className="featured-index">0{index + 1}</span>

                <motion.div
                  className="featured-discover"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  whileHover={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  Discover
                </motion.div>
              </div>

              <div className="featured-product-info">
                <div>
                  <p className="featured-category">{product.category}</p>

                  <h3>{product.name}</h3>
                </div>

                <p className="featured-price">
                  ${Number(product.price).toFixed(2)}
                </p>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </section>
  );
}

export default FeaturedCollection;
