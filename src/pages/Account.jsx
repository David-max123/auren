import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    let unsubscribeWishlist = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);

      if (unsubscribeWishlist) {
        unsubscribeWishlist();
        unsubscribeWishlist = null;
      }

      if (!currentUser) {
        setOrders([]);
        setWishlistCount(0);
        setLoadingOrders(false);
        return;
      }

      /* ========================================
         LOAD WISHLIST COUNT
      ======================================== */

      const wishlistRef = doc(db, "wishlists", currentUser.uid);

      unsubscribeWishlist = onSnapshot(
        wishlistRef,
        (wishlistSnapshot) => {
          if (wishlistSnapshot.exists()) {
            const items = wishlistSnapshot.data().items || [];
            setWishlistCount(items.length);
          } else {
            setWishlistCount(0);
          }
        },
        (error) => {
          console.error("Error listening to wishlist:", error);
          setWishlistCount(0);
        },
      );

      /* ========================================
         LOAD ORDERS
      ======================================== */

      try {
        const ordersRef = collection(db, "orders");

        const ordersQuery = query(
          ordersRef,
          where("userId", "==", currentUser.uid),
        );

        const ordersSnapshot = await getDocs(ordersQuery);

        const userOrders = ordersSnapshot.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        }));

        userOrders.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;

          return dateB - dateA;
        });

        setOrders(userOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeWishlist) {
        unsubscribeWishlist();
      }
    };
  }, []);

  useEffect(() => {
    if (!checkingAuth && !user) {
      navigate("/login", { replace: true });
    }
  }, [checkingAuth, user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const formatOrderDate = (timestamp) => {
    if (!timestamp) {
      return "Recent order";
    }

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOrderNumber = (order) => {
    if (order.orderNumber) {
      return order.orderNumber;
    }

    const year = order.createdAt?.toDate
      ? order.createdAt.toDate().getFullYear()
      : new Date().getFullYear();

    return `#AUR-${year}-${order.id.slice(0, 6).toUpperCase()}`;
  };

  const getItemCount = (order) => {
    return (order.items || []).reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0,
    );
  };

  const formatPrice = (price) => {
    return `$${Number(price || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusClass = (status) => {
    return `account-order-status-${(status || "Processing")
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  if (checkingAuth) {
    return (
      <main className="account-page">
        <div className="container">
          <div className="account-loading">Loading your account...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.displayName || "Auren Customer";
  const email = user.email || "No email available";

  return (
    <main className="account-page">
      <div className="container">
        <motion.div
          className="account-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="section-eyebrow">AUREN / ACCOUNT</p>

            <h1>
              Welcome,
              <span>{displayName}.</span>
            </h1>

            <p>Manage your account, orders, saved objects, and preferences.</p>
          </div>

          <button className="account-signout" onClick={handleSignOut}>
            Sign out
            <span>↗</span>
          </button>
        </motion.div>

        <motion.div
          className="account-grid"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* PROFILE */}
          <section className="account-card account-profile">
            <div className="account-card-top">
              <span>01 / PROFILE</span>
              <span>AUREN</span>
            </div>

            <div className="account-profile-content">
              <div className="account-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2>{displayName}</h2>
                <p>{email}</p>
              </div>
            </div>
          </section>

          {/* ORDERS */}
          <section className="account-card account-orders-card">
            <div className="account-card-top">
              <span>02 / ORDERS</span>

              <span>
                {loadingOrders ? "—" : String(orders.length).padStart(2, "0")}
              </span>
            </div>

            <div className="account-card-content">
              {loadingOrders ? (
                <>
                  <h2>Loading orders...</h2>

                  <p>We're retrieving your latest purchases.</p>
                </>
              ) : orders.length === 0 ? (
                <>
                  <h2>No orders yet.</h2>

                  <p>
                    Your orders will appear here once you complete a purchase.
                  </p>

                  <button
                    className="account-link"
                    onClick={() => navigate("/shop")}
                  >
                    Explore the collection
                    <span>↗</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="account-orders-list">
                    {orders.slice(0, 3).map((order) => (
                      <button
                        className="account-order"
                        key={order.id}
                        onClick={() => navigate(`/account/orders/${order.id}`)}
                      >
                        <div className="account-order-main">
                          <span className="account-order-number">
                            {getOrderNumber(order)}
                          </span>

                          <span className="account-order-date">
                            {formatOrderDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="account-order-details">
                          <span>
                            {getItemCount(order)}{" "}
                            {getItemCount(order) === 1 ? "item" : "items"}
                          </span>

                          <span>{formatPrice(order.total)}</span>

                          <span
                            className={`account-order-status ${getStatusClass(
                              order.status,
                            )}`}
                          >
                            {order.status || "Processing"}
                          </span>

                          <span className="account-order-arrow">↗</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <p className="account-orders-hint">
                    Select an order to view its details.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* WISHLIST */}
          <section className="account-card">
            <div className="account-card-top">
              <span>03 / SAVED OBJECTS</span>

              <span>{String(wishlistCount).padStart(2, "0")}</span>
            </div>

            <div className="account-card-content">
              <h2>Your wishlist.</h2>

              <p>Revisit the objects you've saved for later.</p>

              <button
                className="account-link"
                onClick={() => navigate("/wishlist")}
              >
                View wishlist
                <span>↗</span>
              </button>
            </div>
          </section>

          {/* PREFERENCES */}
          <section className="account-card">
            <div className="account-card-top">
              <span>04 / PREFERENCES</span>
              <span>—</span>
            </div>

            <div className="account-card-content">
              <h2>Account preferences.</h2>

              <p>
                More account settings and preferences will be available here.
              </p>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}

export default Account;
