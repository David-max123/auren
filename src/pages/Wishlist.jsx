import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Wishlist() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setWishlist([]);
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      try {
        const wishlistRef = doc(db, "wishlists", currentUser.uid);
        const wishlistSnapshot = await getDoc(wishlistRef);

        if (!wishlistSnapshot.exists()) {
          setWishlist([]);
          setLoading(false);
          return;
        }

        const savedItems = wishlistSnapshot.data().items || [];

        if (savedItems.length === 0) {
          setWishlist([]);
          setLoading(false);
          return;
        }

        // Get the latest product information from Firestore
        const productsSnapshot = await getDocs(collection(db, "products"));

        const productsMap = new Map();

        productsSnapshot.forEach((productDoc) => {
          productsMap.set(productDoc.id, {
            id: productDoc.id,
            ...productDoc.data(),
          });
        });

        // Refresh wishlist items using the current product data
        const updatedWishlist = savedItems
          .map((savedProduct) => {
            const currentProduct = productsMap.get(savedProduct.id);

            if (!currentProduct) {
              return null;
            }

            return {
              ...currentProduct,
              price: Number(currentProduct.price),
            };
          })
          .filter(Boolean);

        setWishlist(updatedWishlist);

        // Remove products that no longer exist
        if (updatedWishlist.length !== savedItems.length) {
          await setDoc(wishlistRef, {
            items: updatedWishlist,
          });
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const removeFromWishlist = async (productId) => {
    if (!user) return;

    const previousWishlist = wishlist;

    const updatedWishlist = wishlist.filter(
      (product) => product.id !== productId,
    );

    setWishlist(updatedWishlist);

    try {
      await setDoc(doc(db, "wishlists", user.uid), {
        items: updatedWishlist,
      });
    } catch (error) {
      console.error("Error removing wishlist item:", error);

      setWishlist(previousWishlist);
    }
  };

  const addToCart = async (product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(product.id);

      // Check the latest product information before adding
      const productRef = doc(db, "products", product.id);
      const productSnapshot = await getDoc(productRef);

      if (!productSnapshot.exists()) {
        alert("This product is no longer available.");
        return;
      }

      const currentProduct = {
        id: productSnapshot.id,
        ...productSnapshot.data(),
      };

      const stock = Number(currentProduct.stock || 0);

      if (stock <= 0) {
        alert("This product is currently out of stock.");
        return;
      }

      const cartRef = doc(db, "carts", user.uid);
      const cartSnapshot = await getDoc(cartRef);

      const currentCart = cartSnapshot.exists()
        ? cartSnapshot.data().items || []
        : [];

      const existingProduct = currentCart.find(
        (item) => item.id === product.id,
      );

      let updatedCart;

      if (existingProduct) {
        if (Number(existingProduct.quantity) >= stock) {
          alert("You have reached the available stock for this product.");
          return;
        }

        updatedCart = currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                name: currentProduct.name,
                category: currentProduct.category,
                price: Number(currentProduct.price),
                image: currentProduct.image || "",
                quantity: Number(item.quantity) + 1,
              }
            : item,
        );
      } else {
        updatedCart = [
          ...currentCart,
          {
            id: currentProduct.id,
            name: currentProduct.name,
            category: currentProduct.category,
            price: Number(currentProduct.price),
            quantity: 1,
            image: currentProduct.image || "",
          },
        ];
      }

      await setDoc(cartRef, {
        items: updatedCart,
      });

      navigate("/cart");
    } catch (error) {
      console.error("Error adding wishlist item to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <main className="wishlist-page">
        <div className="container">
          <div className="account-loading">Loading your saved objects...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="wishlist-page">
      <div className="container">
        <motion.header
          className="wishlist-header"
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="section-eyebrow">AUREN / SAVED</p>

            <h1>
              Things worth
              <span>keeping.</span>
            </h1>
          </div>

          <p className="wishlist-count">{wishlist.length} saved objects</p>
        </motion.header>

        {wishlist.length > 0 ? (
          <div className="wishlist-grid">
            {wishlist.map((product, index) => (
              <motion.article
                className="wishlist-card"
                key={product.id}
                initial={{
                  opacity: 0,
                  y: 40,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className="wishlist-image"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img src={product.image} alt={product.name} />

                  <button
                    className="wishlist-remove"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="wishlist-info">
                  <div>
                    <h2>{product.name}</h2>
                    <p>{product.category}</p>
                  </div>

                  <span>
                    $
                    {Number(product.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <button
                  className="wishlist-cart-button"
                  disabled={
                    addingToCart === product.id ||
                    Number(product.stock || 0) <= 0
                  }
                  onClick={() => addToCart(product)}
                >
                  {Number(product.stock || 0) <= 0
                    ? "Out of stock"
                    : addingToCart === product.id
                      ? "Adding..."
                      : "Add to cart"}

                  {Number(product.stock || 0) > 0 && <span>↗</span>}
                </button>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            className="wishlist-empty"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <p className="section-eyebrow">AUREN / SAVED</p>

            <h2>
              Nothing saved
              <span>yet.</span>
            </h2>

            <p>
              Save the objects you love and return to them whenever you're
              ready.
            </p>

            <button onClick={() => navigate("/shop")}>
              Explore the shop
              <span>↗</span>
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default Wishlist;


