import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        
        const userSnapshot = await getDocs(collection(db, "users"));

        const currentUserDoc = userSnapshot.docs.find(
          (userDoc) => userDoc.id === currentUser.uid,
        );

        if (!currentUserDoc || currentUserDoc.data().role !== "admin") {
          navigate("/", { replace: true });
          return;
        }

        setCheckingAccess(false);

        const productsSnapshot = await getDocs(collection(db, "products"));

        const loadedProducts = productsSnapshot.docs.map((productDoc) => ({
          id: productDoc.id,
          ...productDoc.data(),
        }));

        setProducts(loadedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setCheckingAccess(false);
        setLoadingProducts(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatPrice = (price) => {
    return `$${Number(price || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);

      await deleteDoc(doc(db, "products", productId));

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Unable to delete this product.");
    } finally {
      setDeletingId(null);
    }
  };

  if (checkingAccess) {
    return (
      <main className="admin-page">
        <div className="container">
          <div className="admin-loading">Checking admin access...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="container">
        <motion.header
          className="admin-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="section-eyebrow">AUREN / ADMIN / PRODUCTS</p>

            <h1>
              Manage
              <span>products.</span>
            </h1>

            <p>Add, edit and manage the products available in your store.</p>
          </div>

          <button
            className="admin-store-link"
            onClick={() => navigate("/admin")}
          >
            ← Dashboard
          </button>
        </motion.header>

        <motion.section
          className="admin-products-management"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="admin-section-heading">
            <div>
              <p className="section-eyebrow">STORE INVENTORY</p>

              <h2>All products</h2>
            </div>

            <div className="admin-products-actions">
              <span>
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </span>

              <button
                className="admin-primary-button"
                onClick={() => navigate("/admin/products/new")}
              >
                + Add product
              </button>
            </div>
          </div>

          {loadingProducts ? (
            <div className="admin-loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="admin-empty">
              <h3>No products yet.</h3>

              <p>
                Add your first product to start building your store inventory.
              </p>

              <button
                className="admin-primary-button"
                onClick={() => navigate("/admin/products/new")}
              >
                + Add first product
              </button>
            </div>
          ) : (
            <div className="admin-products-table">
              <div className="admin-products-row admin-products-head">
                <span>Product</span>
                <span>Category</span>
                <span>Price</span>
                <span>Stock</span>
                <span>Actions</span>
              </div>

              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="admin-products-row"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                  }}
                >
                  <div className="admin-product-info">
                    <div className="admin-product-image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <span>No image</span>
                      )}
                    </div>

                    <div>
                      <strong>{product.name}</strong>

                      {product.description && (
                        <small>{product.description}</small>
                      )}
                    </div>
                  </div>

                  <span>{product.category || "Uncategorized"}</span>

                  <span>{formatPrice(product.price)}</span>

                  <span>{product.stock ?? 0}</span>

                  <div className="admin-product-actions">
                    <button
                      onClick={() =>
                        navigate(`/admin/products/${product.id}/edit`)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="admin-delete-button"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product.id)}
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

export default AdminProducts;
