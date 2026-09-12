import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function Admin() {
  const navigate = useNavigate();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productCount, setProductCount] = useState(0);

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

        const [ordersSnapshot, customersSnapshot, productsSnapshot] =
          await Promise.all([
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "products")),
          ]);

        const loadedOrders = ordersSnapshot.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        }));

        const loadedCustomers = customersSnapshot.docs.map((userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        }));

        loadedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;

          return dateB - dateA;
        });

        setOrders(loadedOrders);
        setCustomers(loadedCustomers);
        setProductCount(productsSnapshot.size);
      } catch (error) {
        console.error("Error loading admin dashboard:", error);
      } finally {
        setCheckingAccess(false);
        setLoadingDashboard(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((total, order) => total + Number(order.total || 0), 0);
  }, [orders]);

  const customerCount = useMemo(() => {
    return customers.filter((customer) => customer.role !== "admin").length;
  }, [customers]);

  const formatPrice = (price) => {
    return `$${Number(price || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recent";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOrderNumber = (order) => {
    const year = order.createdAt?.toDate
      ? order.createdAt.toDate().getFullYear()
      : new Date().getFullYear();

    return `#AUR-${year}-${order.id.slice(0, 6).toUpperCase()}`;
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
          <div className="admin-header-content">
            <p className="section-eyebrow">AUREN / ADMIN</p>

            <div className="admin-header-title-row">
              <span className="admin-header-index">01</span>

              <span className="admin-header-line" />
            </div>

            <h1>
              Store
              <span>overview.</span>
            </h1>

            <p>
              Monitor orders, revenue, customers and store activity from one
              place.
            </p>
          </div>

          <button className="admin-store-link" onClick={() => navigate("/")}>
            <span>View store</span>
            <span className="admin-store-link-arrow">↗</span>
          </button>
        </motion.header>

        {loadingDashboard ? (
          <div className="admin-loading">Loading dashboard...</div>
        ) : (
          <>
            <motion.section
              className="admin-stats-grid"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>01</span>
                  <span>ORDERS</span>
                </div>

                <strong>{String(orders.length).padStart(2, "0")}</strong>

                <div className="admin-stat-bottom">
                  <p>Total orders placed</p>
                  <span className="admin-stat-arrow">↗</span>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-card-featured">
                <div className="admin-stat-top">
                  <span>02</span>
                  <span>REVENUE</span>
                </div>

                <strong>{formatPrice(totalRevenue)}</strong>

                <div className="admin-stat-bottom">
                  <p>Total store revenue</p>
                  <span className="admin-stat-arrow">↗</span>
                </div>
              </div>

              <motion.button
                type="button"
                className="admin-stat-card admin-stat-card-interactive"
                onClick={() => navigate("/admin/customers")}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="admin-stat-top">
                  <span>CUSTOMERS</span>
                  <span>03</span>
                </div>

                <div className="admin-stat-main">
                  <strong>{String(customerCount).padStart(2, "0")}</strong>
                  <span>Registered customers</span>
                </div>

                <div className="admin-stat-bottom">
                  <span>View customers</span>
                  <span className="admin-stat-arrow">↗</span>
                </div>
              </motion.button>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span>04</span>
                  <span>PRODUCTS</span>
                </div>

                <strong>{String(productCount).padStart(2, "0")}</strong>

                <div className="admin-stat-bottom">
                  <p>Products in catalogue</p>
                  <span className="admin-stat-arrow">↗</span>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="admin-recent-section"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="admin-section-heading">
                <div>
                  <p className="section-eyebrow">RECENT ACTIVITY</p>

                  <h2>Recent orders</h2>
                </div>

                <button
                  className="admin-view-orders"
                  onClick={() => navigate("/admin/orders")}
                >
                  <span>{orders.length} total</span>
                  <span>View all ↗</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="admin-empty">
                  <span className="admin-empty-number">00</span>

                  <h3>No orders yet.</h3>

                  <p>
                    Customer orders will appear here once purchases are made.
                  </p>
                </div>
              ) : (
                <div className="admin-orders-table">
                  <div className="admin-orders-row admin-orders-head">
                    <span>Order</span>
                    <span>Customer</span>
                    <span>Date</span>
                    <span>Total</span>
                    <span>Status</span>
                  </div>

                  {orders.slice(0, 5).map((order, index) => (
                    <motion.button
                      type="button"
                      className="admin-order-button"
                      key={order.id}
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.45,
                        delay: 0.25 + index * 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div className="admin-orders-row">
                        <span className="admin-order-number">
                          {getOrderNumber(order)}
                        </span>

                        <span>
                          {order.customer?.email ||
                            order.customer?.firstName ||
                            "Customer"}
                        </span>

                        <span>{formatDate(order.createdAt)}</span>

                        <span className="admin-order-total">
                          {formatPrice(order.total)}
                        </span>

                        <span
                          className={`admin-status admin-status-${(
                            order.status || "Processing"
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {order.status || "Processing"}
                        </span>

                        <span className="admin-order-arrow">↗</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.section>
          </>
        )}
      </div>
    </main>
  );
}

export default Admin;
