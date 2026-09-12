import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function AdminOrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

        const orderRef = doc(db, "orders", orderId);
        const orderSnapshot = await getDoc(orderRef);

        if (orderSnapshot.exists()) {
          setOrder({
            id: orderSnapshot.id,
            ...orderSnapshot.data(),
          });
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error("Error loading order:", error);
      } finally {
        setCheckingAccess(false);
        setLoadingOrder(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, orderId]);

  const updateStatus = async (newStatus) => {
    if (!order) return;

    try {
      setUpdatingStatus(true);

      const orderRef = doc(db, "orders", order.id);

      await updateDoc(orderRef, {
        status: newStatus,
      });

      setOrder((current) => ({
        ...current,
        status: newStatus,
      }));
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

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
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOrderNumber = () => {
    if (!order) return "";

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

  if (loadingOrder) {
    return (
      <main className="admin-page">
        <div className="container">
          <div className="admin-loading">Loading order...</div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="admin-page">
        <div className="container">
          <div className="admin-empty">
            <p className="section-eyebrow">AUREN / ADMIN / 404</p>

            <h3>Order not found.</h3>

            <p>The order you're looking for doesn't exist.</p>

            <button
              className="admin-store-link"
              onClick={() => navigate("/admin/orders")}
            >
              ← Back to orders
            </button>
          </div>
        </div>
      </main>
    );
  }

  const customer = order.customer || {};
  const shippingAddress = order.shippingAddress || {};

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
            <p className="section-eyebrow">AUREN / ADMIN / ORDER</p>

            <h1>{getOrderNumber()}.</h1>

            <p>Placed on {formatDate(order.createdAt)}</p>
          </div>

          <button
            className="admin-store-link"
            onClick={() => navigate("/admin/orders")}
          >
            ← All orders
          </button>
        </motion.header>

        <motion.div
          className="admin-order-detail-grid"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Order Items */}
          <section className="admin-detail-card">
            <div className="admin-detail-card-header">
              <span>01 / ITEMS</span>
              <span>{order.items?.length || 0}</span>
            </div>

            <div className="admin-detail-items">
              {(order.items || []).map((item, index) => (
                <div className="admin-detail-item" key={item.id || index}>
                  <div className="admin-detail-item-image">
                    <img src={item.image} alt={item.name} />

                    <span>{item.quantity || 1}</span>
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.category}</p>
                  </div>

                  <strong>
                    {formatPrice(
                      Number(item.price || 0) * Number(item.quantity || 1),
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="admin-detail-total">
              <span>Total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </section>

          {/* Status */}
          <section className="admin-detail-card">
            <div className="admin-detail-card-header">
              <span>02 / STATUS</span>
              <span>{order.status || "Processing"}</span>
            </div>

            <div className="admin-status-controls">
              <p>Update the current status of this order.</p>

              <div className="admin-status-buttons">
                {["Processing", "Shipped", "Completed", "Cancelled"].map(
                  (status) => (
                    <button
                      key={status}
                      className={order.status === status ? "selected" : ""}
                      disabled={updatingStatus}
                      onClick={() => updateStatus(status)}
                    >
                      <span
                        className={`admin-status-dot admin-status-dot-${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      />

                      {status}
                    </button>
                  ),
                )}
              </div>

              {updatingStatus && <small>Updating order...</small>}
            </div>
          </section>

          {/* Customer */}
          <section className="admin-detail-card">
            <div className="admin-detail-card-header">
              <span>03 / CUSTOMER</span>
              <span>AUREN</span>
            </div>

            <div className="admin-detail-content">
              <h2>
                {customer.firstName || customer.lastName
                  ? `${customer.firstName || ""} ${
                      customer.lastName || ""
                    }`.trim()
                  : "Customer"}
              </h2>

              <p>{customer.email || "No email available"}</p>

              {customer.phone && <p>{customer.phone}</p>}
            </div>
          </section>

          {/* Shipping */}
          <section className="admin-detail-card">
            <div className="admin-detail-card-header">
              <span>04 / SHIPPING</span>
              <span>ADDRESS</span>
            </div>

            <div className="admin-detail-content">
              <p>
                {shippingAddress.firstName || shippingAddress.lastName
                  ? `${shippingAddress.firstName || ""} ${
                      shippingAddress.lastName || ""
                    }`.trim()
                  : ""}
              </p>

              <p>{shippingAddress.address || "No address"}</p>

              <p>
                {shippingAddress.city || ""}
                {shippingAddress.state ? `, ${shippingAddress.state}` : ""}
              </p>

              <p>{shippingAddress.postalCode || ""}</p>

              <p>{shippingAddress.country || ""}</p>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}

export default AdminOrderDetails;
