import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  // Load product from Firestore
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setProductLoading(true);

        const productRef = doc(db, "products", id);
        const productSnapshot = await getDoc(productRef);

        if (productSnapshot.exists()) {
          const data = productSnapshot.data();

          setProduct({
            id: productSnapshot.id,
            ...data,
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setProduct(null);
      } finally {
        setProductLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
  }, [id]);

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Check wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user || !product) {
        setIsWishlisted(false);
        setWishlistLoading(false);
        return;
      }

      try {
        setWishlistLoading(true);

        const wishlistRef = doc(db, "wishlists", user.uid);
        const wishlistSnapshot = await getDoc(wishlistRef);

        if (wishlistSnapshot.exists()) {
          const items = wishlistSnapshot.data().items || [];

          setIsWishlisted(items.some((item) => item.id === product.id));
        } else {
          setIsWishlisted(false);
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
        setIsWishlisted(false);
      } finally {
        setWishlistLoading(false);
      }
    };

    checkWishlist();
  }, [user, product]);

  // Loading state
  if (productLoading) {
    return (
      <main className="product-page">
        <div className="container product-not-found">
          <p className="section-eyebrow">AUREN / LOADING</p>

          <h1>Loading product...</h1>
        </div>
      </main>
    );
  }

  // Product not found
  if (!product) {
    return (
      <main className="product-page">
        <div className="container product-not-found">
          <p className="section-eyebrow">AUREN / 404</p>

          <h1>Product not found.</h1>

          <button
            className="product-back-button"
            onClick={() => navigate("/shop")}
          >
            Back to shop
            <span>↗</span>
          </button>
        </div>
      </main>
    );
  }

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock <= 0;

  const productDetails = product.details || [
    "Thoughtfully considered proportions",
    "Designed for everyday use",
    "Refined contemporary finish",
  ];

  const increaseQuantity = () => {
    if (quantity >= stock) {
      return;
    }

    setQuantity((current) => current + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  // Wishlist
  const toggleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading(true);

      const wishlistRef = doc(db, "wishlists", user.uid);

      const wishlistSnapshot = await getDoc(wishlistRef);

      const currentWishlist = wishlistSnapshot.exists()
        ? wishlistSnapshot.data().items || []
        : [];

      const alreadySaved = currentWishlist.some(
        (item) => item.id === product.id,
      );

      let updatedWishlist;

      if (alreadySaved) {
        updatedWishlist = currentWishlist.filter(
          (item) => item.id !== product.id,
        );

        setIsWishlisted(false);
      } else {
        const wishlistProduct = {
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price),
          image: product.image || "",
        };

        updatedWishlist = [...currentWishlist, wishlistProduct];

        setIsWishlisted(true);
      }

      await setDoc(wishlistRef, {
        items: updatedWishlist,
      });
    } catch (error) {
      console.error("Error updating wishlist:", error);
      alert("Unable to update your wishlist. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  // Create updated cart
  const updateCart = async () => {
    if (!user) {
      navigate("/login");
      return false;
    }

    if (isOutOfStock) {
      alert("This product is currently out of stock.");
      return false;
    }

    if (quantity > stock) {
      alert(`Only ${stock} of this product are available.`);
      return false;
    }

    const cartRef = doc(db, "carts", user.uid);
    const cartSnapshot = await getDoc(cartRef);

    const currentCart = cartSnapshot.exists()
      ? cartSnapshot.data().items || []
      : [];

    const existingProduct = currentCart.find((item) => item.id === product.id);

    let updatedCart;

    if (existingProduct) {
      const newQuantity = Number(existingProduct.quantity) + quantity;

      if (newQuantity > stock) {
        alert(`Only ${stock} of this product are available.`);
        return false;
      }

      updatedCart = currentCart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              name: product.name,
              category: product.category,
              price: Number(product.price),
              image: product.image || "",
              quantity: newQuantity,
            }
          : item,
      );
    } else {
      updatedCart = [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price),
          quantity,
          image: product.image || "",
        },
      ];
    }

    await setDoc(cartRef, {
      items: updatedCart,
    });

    return true;
  };

  // Add to cart
  const addToCart = async () => {
    try {
      setAddingToCart(true);

      const success = await updateCart();

      if (success) {
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      alert("Unable to add this product to your cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Buy now
  const buyNow = async () => {
    try {
      setAddingToCart(true);

      const success = await updateCart();

      if (success) {
        navigate("/checkout");
      }
    } catch (error) {
      console.error("Error processing buy now:", error);
      alert("Unable to process your purchase. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <main className="product-page">
      <div className="container">
        {/* Breadcrumb */}
        <motion.div
          className="product-breadcrumb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <button onClick={() => navigate("/shop")}>Shop</button>

          <span>/</span>

          <span>{product.name}</span>
        </motion.div>

        {/* Product */}
        <div className="product-layout">
          {/* Image */}
          <motion.div
            className="product-main-image"
            initial={{
              opacity: 0,
              x: -30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <span className="product-image-number">AUREN</span>
          </motion.div>

          {/* Information */}
          <motion.div
            className="product-details"
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="section-eyebrow">{product.category}</p>

            <h1>{product.name}</h1>

            <p className="product-price">
              ${Number(product.price).toLocaleString()}
            </p>

            <div className="product-divider" />

            <p className="product-description">
              {product.description ||
                "A thoughtfully designed Auren object created for modern living."}
            </p>

            {/* Quantity */}
            <div className="product-option">
              <span className="product-option-label">Quantity</span>

              <div className="quantity-control">
                <button onClick={decreaseQuantity} disabled={quantity <= 1}>
                  −
                </button>

                <span>{quantity}</span>

                <button
                  onClick={increaseQuantity}
                  disabled={isOutOfStock || quantity >= stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock */}
            <p className="product-stock">
              {stock > 0
                ? stock === 1
                  ? "1 available"
                  : `${stock} available`
                : "Out of stock"}
            </p>

            {/* Actions */}
            <div className="product-actions">
              <button
                className="product-add-cart"
                onClick={addToCart}
                disabled={addingToCart || isOutOfStock}
              >
                {addingToCart
                  ? "Adding..."
                  : isOutOfStock
                    ? "Out of stock"
                    : "Add to cart"}
              </button>

              <button
                className="product-buy-now"
                onClick={buyNow}
                disabled={addingToCart || isOutOfStock}
              >
                {addingToCart ? "Preparing..." : "Buy now"}

                <span>↗</span>
              </button>
            </div>

            {/* Wishlist */}
            <button
              className={`product-wishlist-button ${
                isWishlisted ? "active" : ""
              }`}
              onClick={toggleWishlist}
              disabled={wishlistLoading}
            >
              <Heart
                size={18}
                strokeWidth={1.6}
                fill={isWishlisted ? "currentColor" : "none"}
              />

              <span>
                {wishlistLoading
                  ? "Saving..."
                  : isWishlisted
                    ? "Saved to wishlist"
                    : "Add to wishlist"}
              </span>
            </button>

            {/* Details */}
            <div className="product-information">
              <div className="product-information-header">
                <span>PRODUCT DETAILS</span>

                <span>{String(productDetails.length).padStart(2, "0")}</span>
              </div>

              <ul>
                {productDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>

            {/* Shipping */}
            <div className="product-shipping">
              <div>
                <span>SHIPPING</span>

                <p>Complimentary delivery on orders over $150.</p>
              </div>

              <div>
                <span>RETURNS</span>

                <p>Easy returns within 30 days of delivery.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

export default Product;
