import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function AdminProductForm() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const isEditing = Boolean(productId);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    image: "",
    description: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists() || userSnapshot.data().role !== "admin") {
          navigate("/", { replace: true });
          return;
        }

        setCheckingAccess(false);

        if (isEditing) {
          const productRef = doc(db, "products", productId);
          const productSnapshot = await getDoc(productRef);

          if (!productSnapshot.exists()) {
            navigate("/admin/products", { replace: true });
            return;
          }

          const product = productSnapshot.data();

          setForm({
            name: product.name || "",
            category: product.category || "",
            price: product.price ?? "",
            stock: product.stock ?? "",
            image: product.image || "",
            description: product.description || "",
          });

          if (product.image) {
            setImageLoading(true);
          }
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setCheckingAccess(false);
        setLoadingProduct(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, isEditing, productId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "image") {
      setImageError(false);

      if (value.trim()) {
        setImageLoading(true);
      } else {
        setImageLoading(false);
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const isPinterestUrl = (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      return hostname.includes("pinterest.com") || hostname.includes("pin.it");
    } catch {
      return false;
    }
  };

  const isValidImageUrl = (url) => {
    // Allow local images inside the public folder
    if (url.startsWith("/")) {
      return true;
    }

    // Allow external HTTP/HTTPS image URLs
    try {
      const parsedUrl = new URL(url);

      return ["http:", "https:"].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    if (!form.category.trim()) {
      alert("Please enter a product category.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    const imageUrl = form.image.trim();

    if (imageUrl) {
      if (!isValidImageUrl(imageUrl)) {
        alert("Please enter a valid image URL.");
        return;
      }

      if (isPinterestUrl(imageUrl)) {
        alert(
          "Pinterest page URLs cannot be used as product images. Please use a direct image URL from a supported image website.",
        );
        return;
      }

      if (imageError) {
        alert(
          "This image could not be loaded. Please check the URL and try another image.",
        );
        return;
      }
    }

    try {
      setSaving(true);

      const productData = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        image: imageUrl,
        description: form.description.trim(),
        updatedAt: serverTimestamp(),
      };

      if (isEditing) {
        const productRef = doc(db, "products", productId);

        await updateDoc(productRef, productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }

      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Unable to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (checkingAccess || loadingProduct) {
    return (
      <main className="admin-page">
        <div className="container">
          <div className="admin-loading">
            {checkingAccess ? "Checking admin access..." : "Loading product..."}
          </div>
        </div>
      </main>
    );
  }

  const hasImage = form.image.trim() !== "";

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
              {isEditing ? "Edit" : "Add"}
              <span>product.</span>
            </h1>

            <p>
              {isEditing
                ? "Update the details of this product."
                : "Create a new product for the Auren store."}
            </p>
          </div>

          <button
            className="admin-store-link"
            onClick={() => navigate("/admin/products")}
          >
            ← Products
          </button>
        </motion.header>

        <motion.section
          className="admin-product-form-section"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-wide">
                <label htmlFor="name">Product name</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Silk Evening Dress"
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="category">Category</label>

                <input
                  id="category"
                  name="category"
                  type="text"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Dresses"
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="price">Price</label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="stock">Stock</label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="admin-form-field admin-form-field-wide">
                <label htmlFor="image">Product image</label>

                <input
                  id="image"
                  name="image"
                  type="text"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="/products/product-04.jpg or https://..."
                />

                <small>
                  Use a local image such as /products/product-04.jpg or a direct
                  image URL from a supported image website.
                </small>
              </div>

              <div className="admin-form-field admin-form-field-wide">
                <label htmlFor="description">Description</label>

                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the product..."
                />
              </div>
            </div>

            {hasImage && (
              <div className="admin-product-preview">
                <p className="section-eyebrow">IMAGE PREVIEW</p>

                <div className="admin-product-preview-image">
                  {imageLoading && (
                    <div className="admin-image-loading">Loading image...</div>
                  )}

                  {!imageError ? (
                    <img
                      src={form.image}
                      alt="Product preview"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="admin-image-error">
                      <strong>Image unavailable</strong>

                      <span>
                        This URL doesn't appear to point to a usable image.
                      </span>

                      <small>
                        Try copying the direct image address instead of the
                        webpage address.
                      </small>
                    </div>
                  )}
                </div>

                {imageError && (
                  <p className="admin-image-error-text">
                    Please enter a working direct image URL before creating this
                    product.
                  </p>
                )}
              </div>
            )}

            <div className="admin-form-footer">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => navigate("/admin/products")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving || imageLoading || imageError}
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create product"}
              </button>
            </div>
          </form>
        </motion.section>
      </div>
    </main>
  );
}

export default AdminProductForm;
