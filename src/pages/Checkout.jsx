import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Checkout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nigeria",
    phone: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

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

      setFormData((current) => ({
        ...current,
        email: currentUser.email || "",
        firstName:
          current.firstName || currentUser.displayName?.split(" ")[0] || "",
        lastName:
          current.lastName ||
          currentUser.displayName?.split(" ").slice(1).join(" ") ||
          "",
      }));

      try {
        const cartRef = doc(db, "carts", currentUser.uid);

        const cartSnapshot = await getDoc(cartRef);

        if (cartSnapshot.exists()) {
          setCartItems(cartSnapshot.data().items || []);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error("Error loading checkout cart:", error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const subtotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0,
  );

  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 15;

  const total = subtotal + shipping;

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity),
    0,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (orderError) {
      setOrderError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      return;
    }

    try {
      setPlacingOrder(true);
      setOrderError("");

      /*
        Everything inside this transaction succeeds together:

        1. Check current product stock.
        2. Create the order.
        3. Reduce product stock.
        4. Clear the user's cart.

        This prevents overselling when stock is limited.
      */

      const result = await runTransaction(db, async (transaction) => {
        const productSnapshots = [];

        for (const item of cartItems) {
          const productRef = doc(db, "products", item.id);

          const productSnapshot = await transaction.get(productRef);

          if (!productSnapshot.exists()) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.name}`);
          }

          productSnapshots.push({
            ref: productRef,
            snapshot: productSnapshot,
            item,
          });
        }

        /*
            Verify stock before creating the order.
          */
        for (const { snapshot, item } of productSnapshots) {
          const productData = snapshot.data();

          const availableStock = Number(productData.stock) || 0;

          const requestedQuantity = Number(item.quantity) || 0;

          if (requestedQuantity <= 0 || requestedQuantity > availableStock) {
            throw new Error(
              `INSUFFICIENT_STOCK:${item.name}:${availableStock}`,
            );
          }
        }

        /*
            Create a new Firestore order document.
          */
        const orderRef = doc(collection(db, "orders"));

        const formattedOrderNumber =
          `#AUR-${new Date().getFullYear()}-` +
          orderRef.id.slice(0, 6).toUpperCase();

        const orderData = {
          userId: user.uid,

          orderNumber: formattedOrderNumber,

          customer: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
          },

          shippingAddress: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
          },

          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: Number(item.price),
            quantity: Number(item.quantity),
            image: item.image || "",
          })),

          subtotal,
          shipping,
          total,

          status: "Processing",

          payment: {
            method: "Demo Card",
            status: "Demo Payment",
          },

          createdAt: serverTimestamp(),
        };

        /*
            Create the order.
          */
        transaction.set(orderRef, orderData);

        /*
            Reduce stock for every purchased product.
          */
        for (const { ref, snapshot, item } of productSnapshots) {
          const productData = snapshot.data();

          const currentStock = Number(productData.stock) || 0;

          const newStock = currentStock - Number(item.quantity);

          transaction.update(ref, {
            stock: newStock,
          });
        }

        /*
            Clear the customer's cart.
          */
        const cartRef = doc(db, "carts", user.uid);

        transaction.set(cartRef, {
          items: [],
        });

        return {
          orderNumber: formattedOrderNumber,
        };
      });

      setOrderNumber(result.orderNumber);
      setPlacedOrderTotal(total);
      setOrderPlaced(true);
      setCartItems([]);
    } catch (error) {
      console.error("Error placing order:", error);

      if (error.message?.startsWith("INSUFFICIENT_STOCK:")) {
        const parts = error.message.split(":");

        const productName = parts[1];
        const availableStock = parts[2];

        setOrderError(
          `${productName} does not have enough stock. Only ${availableStock} available. Please return to your cart and adjust the quantity.`,
        );
      } else if (error.message?.startsWith("PRODUCT_NOT_FOUND:")) {
        const productName = error.message.split(":")[1];

        setOrderError(
          `${productName} is no longer available. Please return to your cart and remove it before continuing.`,
        );
      } else {
        setOrderError("We couldn't place your order. Please try again.");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <main className="checkout-page">
        <div className="container">
          <div className="checkout-loading">Loading your checkout...</div>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <main className="checkout-page">
        <div className="container">
          <motion.div
            className="checkout-empty"
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
            <p className="section-eyebrow">AUREN / CHECKOUT</p>

            <h1>
              Your cart is
              <span>empty.</span>
            </h1>

            <p>
              Add something to your selection before continuing to checkout.
            </p>

            <button onClick={() => navigate("/shop")}>
              Browse the collection
              <span>↗</span>
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main className="checkout-page">
        <div className="container">
          <motion.div
            className="checkout-success"
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
            <p className="section-eyebrow">AUREN / ORDER CONFIRMED</p>

            <div className="checkout-success-mark">✓</div>

            <h1>
              Thank you.
              <span>Your order is on its way.</span>
            </h1>

            <p>
              Your Auren order has been successfully placed. This is a
              demonstration checkout, so no real payment has been processed.
            </p>

            <div className="checkout-success-details">
              <div>
                <span>ORDER</span>
                <strong>{orderNumber}</strong>
              </div>

              <div>
                <span>TOTAL</span>
                <strong>${placedOrderTotal.toFixed(2)}</strong>
              </div>
            </div>

            <button onClick={() => navigate("/shop")}>
              Continue shopping
              <span>↗</span>
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <motion.header
          className="checkout-header"
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
            <p className="section-eyebrow">AUREN / CHECKOUT</p>

            <h1>
              Complete
              <span>your order.</span>
            </h1>
          </div>

          <button className="checkout-back" onClick={() => navigate("/cart")}>
            ← Back to cart
          </button>
        </motion.header>

        {orderError && (
          <motion.div
            className="checkout-demo-notice"
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <span>NOTICE</span>

            <p>{orderError}</p>
          </motion.div>
        )}

        <form className="checkout-layout" onSubmit={handleSubmit}>
          <div className="checkout-form">
            <section className="checkout-section">
              <div className="checkout-section-heading">
                <div>
                  <span>01</span>
                  <h2>Contact information</h2>
                </div>
              </div>

              <div className="checkout-field">
                <label htmlFor="email">Email address</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-heading">
                <div>
                  <span>02</span>
                  <h2>Shipping address</h2>
                </div>
              </div>

              <div className="checkout-fields-two">
                <div className="checkout-field">
                  <label htmlFor="firstName">First name</label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="David"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="lastName">Last name</label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Nwosu"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="checkout-field">
                <label htmlFor="address">Address</label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Example Street"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="checkout-fields-two">
                <div className="checkout-field">
                  <label htmlFor="city">City</label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Lagos"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="state">State / Region</label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="Lagos"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="checkout-fields-two">
                <div className="checkout-field">
                  <label htmlFor="postalCode">Postal code</label>

                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    placeholder="100001"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="country">Country</label>

                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  >
                    <option value="Nigeria">Nigeria</option>

                    <option value="United Kingdom">United Kingdom</option>

                    <option value="United States">United States</option>

                    <option value="Canada">Canada</option>

                    <option value="Ghana">Ghana</option>
                  </select>
                </div>
              </div>

              <div className="checkout-field">
                <label htmlFor="phone">Phone number</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-heading">
                <div>
                  <span>03</span>
                  <h2>Payment</h2>
                </div>

                <small>SECURE CHECKOUT</small>
              </div>

              <div className="checkout-demo-notice">
                <span>DEMO</span>

                <p>
                  This is a portfolio demonstration. No real payment will be
                  processed.
                </p>
              </div>

              <div className="checkout-field">
                <label htmlFor="cardName">Name on card</label>

                <input
                  id="cardName"
                  name="cardName"
                  type="text"
                  placeholder="David Nwosu"
                  value={formData.cardName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="cardNumber">Card number</label>

                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="checkout-fields-two">
                <div className="checkout-field">
                  <label htmlFor="expiry">Expiry date</label>

                  <input
                    id="expiry"
                    name="expiry"
                    type="text"
                    placeholder="MM / YY"
                    value={formData.expiry}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="cvc">CVC</label>

                  <input
                    id="cvc"
                    name="cvc"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    value={formData.cvc}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="checkout-summary">
            <div className="checkout-summary-inner">
              <div className="checkout-summary-header">
                <span>YOUR ORDER</span>

                <span>
                  {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
                </span>
              </div>

              <div className="checkout-items">
                {cartItems.map((item) => (
                  <div className="checkout-item" key={item.id}>
                    <div className="checkout-item-image">
                      <img src={item.image} alt={item.name} />

                      <span>{item.quantity}</span>
                    </div>

                    <div className="checkout-item-info">
                      <h3>{item.name}</h3>

                      <p>{item.category}</p>
                    </div>

                    <strong>
                      ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-lines">
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

              <div className="checkout-total">
                <span>Total</span>

                <strong>${total.toFixed(2)}</strong>
              </div>

              <button
                className="checkout-place-order"
                type="submit"
                disabled={placingOrder}
              >
                {placingOrder ? "Placing order..." : "Place order"}

                <span>↗</span>
              </button>

              <p className="checkout-terms">
                By placing your order, you agree to Auren's terms and
                conditions.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

export default Checkout;
