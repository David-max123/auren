import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";

function BestSellers() {
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

        // Show the first 4 real products
        setProducts([...productList.slice(0, 3), ...productList.slice(3, 4)]);
      } catch (error) {
        console.error("Error loading best sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <section className="best-sellers">
      <div className="container">
        {/* Header */}
        <motion.div
          className="best-sellers-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="section-eyebrow">03 / BEST SELLERS</p>

            <h2>
              Most loved.
              <span>Always considered.</span>
            </h2>
          </div>

          <button
            className="best-sellers-view"
            onClick={() => navigate("/shop")}
          >
            View collection
            <span>↗</span>
          </button>
        </motion.div>

        {/* Products */}
        <div className="best-sellers-grid">
          {loading ? (
            <div className="best-sellers-loading">Loading collection...</div>
          ) : (
            products.map((product, index) => (
              <motion.article
                className="best-seller-card"
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="best-seller-image">
                  <img src={product.image} alt={product.name} />

                  <span className="best-seller-number">0{index + 1}</span>
                </div>

                <div className="best-seller-info">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                  </div>

                  <span className="best-seller-price">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default BestSellers;
