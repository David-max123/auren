import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

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

        const ordersSnapshot = await getDocs(collection(db, "orders"));

        const loadedOrders = ordersSnapshot.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        }));

        loadedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;

          return dateB - dateA;
        });

        setOrders(loadedOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setCheckingAccess(false);
        setLoadingOrders(false);
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

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Recent";
    }

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

  const getCustomerName = (order) => {
    if (order.customer?.firstName || order.customer?.lastName) {
      return `${order.customer?.firstName || ""} ${
        order.customer?.lastName || ""
      }`.trim();
    }

    if (order.customer?.email) {
      return order.customer.email;
    }

    return "Customer";
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
            <p className="section-eyebrow">AUREN / ADMIN / ORDERS</p>

            <h1>
              Manage
              <span>orders.</span>
            </h1>

            <p>View customer purchases and manage their order status.</p>
          </div>

          <button
            className="admin-store-link"
            onClick={() => navigate("/admin")}
          >
            ← Dashboard
          </button>
        </motion.header>

        <motion.section
          className="admin-orders-management"
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
              <p className="section-eyebrow">ALL ORDERS</p>

              <h2>Order history</h2>
            </div>

            <span>
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {loadingOrders ? (
            <div className="admin-loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="admin-empty">
              <h3>No orders yet.</h3>

              <p>Orders will appear here once customers complete purchases.</p>
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

              {orders.map((order, index) => (
                <motion.button
                  key={order.id}
                  className="admin-orders-row admin-order-button"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                  }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <span className="admin-order-number">
                    {getOrderNumber(order)}
                  </span>

                  <span>{getCustomerName(order)}</span>

                  <span>{formatDate(order.createdAt)}</span>

                  <span>{formatPrice(order.total)}</span>

                  <span
                    className={`admin-status admin-status-${(
                      order.status || "Processing"
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}
                    `}
                  >
                    {order.status || "Processing"}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

export default AdminOrders;
