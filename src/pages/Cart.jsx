import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Cart() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setCartItems([]);
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);

      try {
        const cartRef = doc(db, "carts", currentUser.uid);
        const cartSnapshot = await getDoc(cartRef);

        if (!cartSnapshot.exists()) {
          setCartItems([]);
          return;
        }

        const savedItems = cartSnapshot.data().items || [];

        /*
          Refresh cart items against the current product data.
          This protects the cart from stale prices, deleted products,
          or products whose stock has changed.
        */
        const productSnapshot = await getDocs(collection(db, "products"));

        const productMap = {};

        productSnapshot.docs.forEach((productDoc) => {
          productMap[productDoc.id] = {
            id: productDoc.id,
            ...productDoc.data(),
          };
        });

        const validItems = savedItems
          .map((item) => {
            const currentProduct = productMap[item.id];

            if (!currentProduct) {
              return null;
            }

            const stock = Number(currentProduct.stock) || 0;

            if (stock <= 0) {
              return null;
            }

            return {
              id: currentProduct.id,
              name: currentProduct.name,
              category: currentProduct.category,
              price: Number(currentProduct.price) || 0,
              image: currentProduct.image || "",
              quantity: Math.min(
                Math.max(Number(item.quantity) || 1, 1),
                stock,
              ),
              stock,
            };
          })
          .filter(Boolean);

        setCartItems(validItems);

        // Keep Firestore synchronized with the cleaned cart.
        await setDoc(cartRef, {
          items: validItems,
        });
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const updateQuantity = async (id, amount) => {
    if (!user) return;

    const currentItem = cartItems.find((item) => item.id === id);

    if (!currentItem) return;

    const newQuantity = Math.min(
      Math.max(1, currentItem.quantity + amount),
      currentItem.stock,
    );

    if (newQuantity === currentItem.quantity) {
      return;
    }

    const updatedItems = cartItems.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: newQuantity,
          }
        : item,
    );

    setCartItems(updatedItems);

    try {
      await setDoc(doc(db, "carts", user.uid), {
        items: updatedItems,
      });
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      setCartItems(cartItems);
    }
  };

  const removeItem = async (id) => {
    if (!user) return;

    const updatedItems = cartItems.filter((item) => item.id !== id);

    setCartItems(updatedItems);

    try {
      await setDoc(doc(db, "carts", user.uid), {
        items: updatedItems,
      });
    } catch (error) {
      console.error("Error removing cart item:", error);
      setCartItems(cartItems);
    }
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 15;

  const total = subtotal + shipping;

  if (loading) {
    return (
      <main className="cart-page">
        <div className="container">
          <div className="account-loading">Loading your cart...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="cart-page">
      <div className="container">
        {/* Header */}
        <motion.header
          className="cart-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="section-eyebrow">AUREN / CART</p>

            <h1>
              Your
              <span>selection.</span>
            </h1>
          </div>

          <p className="cart-count">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </p>
        </motion.header>

        {cartItems.length > 0 ? (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <motion.article
                  className="cart-item"
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.1,
                  }}
                >
                  <div
                    className="cart-item-image"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <div>
                        <p className="cart-item-category">{item.category}</p>

                        <h2>{item.name}</h2>

                        <p className="cart-item-price">
                          ${Number(item.price).toLocaleString()}
                        </p>
                      </div>

                      <button
                        className="cart-remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="cart-item-bottom">
                      <div className="cart-quantity">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Summary */}
            <motion.aside
              className="cart-summary"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
              }}
            >
              <div className="cart-summary-header">
                <span>ORDER SUMMARY</span>
                <span>{String(cartItems.length).padStart(2, "0")}</span>
              </div>

              <div className="cart-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>

                <div>
                  <span>Shipping</span>

                  <strong>
                    {shipping === 0
                      ? "Complimentary"
                      : `$${shipping.toFixed(2)}`}
                  </strong>
                </div>
              </div>

              <div className="cart-total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              <button
                className="cart-checkout-button"
                onClick={() => navigate("/checkout")}
              >
                Proceed to checkout
                <span>↗</span>
              </button>

              <button
                className="cart-continue"
                onClick={() => navigate("/shop")}
              >
                Continue shopping
              </button>

              <p className="cart-note">
                Complimentary delivery is applied to orders over $150.
              </p>
            </motion.aside>
          </div>
        ) : (
          <motion.div
            className="cart-empty"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="section-eyebrow">AUREN / CART</p>

            <h2>
              Your cart is
              <span>empty.</span>
            </h2>

            <p>Discover considered objects designed for everyday living.</p>

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

export default Cart;


