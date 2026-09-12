import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function AdminCustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const adminSnapshot = await getDoc(doc(db, "users", currentUser.uid));

        if (!adminSnapshot.exists() || adminSnapshot.data().role !== "admin") {
          navigate("/", { replace: true });
          return;
        }

        if (!mounted) return;

        setCheckingAccess(false);

        const [customerSnapshot, ordersSnapshot] = await Promise.all([
          getDoc(doc(db, "users", customerId)),
          getDocs(collection(db, "orders")),
        ]);

        if (!customerSnapshot.exists()) {
          setCustomer(null);
          setOrders([]);
          setLoadingCustomer(false);
          return;
        }

        const customerData = {
          id: customerSnapshot.id,
          ...customerSnapshot.data(),
        };

        const customerEmail = String(customerData.email || "")
          .trim()
          .toLowerCase();

        const customerOrders = ordersSnapshot.docs
          .map((orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data(),
          }))
          .filter((order) => {
            const orderCustomer = order.customer || {};

            const customerUid = String(
              orderCustomer.uid ||
                orderCustomer.userId ||
                orderCustomer.id ||
                "",
            );

            const orderUid = String(order.uid || order.userId || "");

            const orderEmail = String(orderCustomer.email || order.email || "")
              .trim()
              .toLowerCase();

            return (
              customerUid === customerId ||
              orderUid === customerId ||
              (customerEmail && orderEmail === customerEmail)
            );
          })
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            return dateB - dateA;
          });

        setCustomer(customerData);
        setOrders(customerOrders);
      } catch (error) {
        console.error("Error loading customer details:", error);
        setCustomer(null);
        setOrders([]);
      } finally {
        if (mounted) {
          setCheckingAccess(false);
          setLoadingCustomer(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [customerId, navigate]);

  const customerName = useMemo(() => {
    if (!customer) return "Customer";

    const firstName = String(customer.firstName || "").trim();
    const lastName = String(customer.lastName || "").trim();

    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || customer.displayName || "Auren Customer";
  }, [customer]);

  const customerInitial = customerName.charAt(0).toUpperCase();

  const totalSpent = useMemo(() => {
    return orders.reduce((total, order) => {
      return total + Number(order.total || 0);
    }, 0);
  }, [orders]);

  const formatPrice = (value) => {
    return `$${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOrderNumber = (order) => {
    const year = new Date(order.createdAt || Date.now()).getFullYear();

    return `#AUR-${year}-${order.id.slice(0, 6).toUpperCase()}`;
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "Processing").toLowerCase();

    if (normalizedStatus === "completed") {
      return "admin-status-completed";
    }

    if (normalizedStatus === "shipped") {
      return "admin-status-shipped";
    }

    if (normalizedStatus === "cancelled") {
      return "admin-status-cancelled";
    }

    return "admin-status-processing";
  };

  if (checkingAccess || loadingCustomer) {
    return (
      <main className="admin-page admin-customer-details-page">
        <div className="admin-loading-state">
          <span>Loading customer</span>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="admin-page admin-customer-details-page">
        <div className="admin-empty-state">
          <span>00</span>
          <h1>Customer not found.</h1>
          <p>
            This customer may have been removed or the profile is no longer
            available.
          </p>

          <button
            type="button"
            className="admin-primary-button"
            onClick={() => navigate("/admin/customers")}
          >
            Back to customers
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page admin-customer-details-page">
      <section className="admin-customer-details-header">
        <button
          type="button"
          className="admin-back-button"
          onClick={() => navigate("/admin/customers")}
        >
          <span>←</span>
          Back to customers
        </button>

        <div className="admin-customer-details-heading">
          <span className="admin-eyebrow">AUREN / CUSTOMER</span>

          <div className="admin-customer-title-row">
            <h1>{customerName}.</h1>
            <span className="admin-customer-index">
              {customerId.slice(0, 6).toUpperCase()}
            </span>
          </div>

          <p>Customer profile, account information, and order history.</p>
        </div>
      </section>

      <section className="admin-customer-profile-grid">
        <motion.div
          className="admin-customer-profile-card admin-customer-profile-main"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="admin-profile-card-top">
            <span>PROFILE</span>
            <span>01</span>
          </div>

          <div className="admin-customer-profile-identity">
            <div className="admin-customer-profile-avatar">
              {customerInitial}
            </div>

            <div>
              <h2>{customerName}</h2>
              <p>{customer.email || "No email available"}</p>
            </div>
          </div>

          <div className="admin-customer-profile-details">
            <div>
              <span>FIRST NAME</span>
              <strong>{customer.firstName || "—"}</strong>
            </div>

            <div>
              <span>LAST NAME</span>
              <strong>{customer.lastName || "—"}</strong>
            </div>

            <div>
              <span>EMAIL</span>
              <strong>{customer.email || "—"}</strong>
            </div>

            <div>
              <span>JOINED</span>
              <strong>{formatDate(customer.createdAt)}</strong>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="admin-customer-profile-card admin-customer-profile-stats"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="admin-profile-card-top">
            <span>ACTIVITY</span>
            <span>02</span>
          </div>

          <div className="admin-customer-stat">
            <strong>{String(orders.length).padStart(2, "0")}</strong>
            <span>Total orders</span>
          </div>

          <div className="admin-customer-stat-divider" />

          <div className="admin-customer-stat">
            <strong>{formatPrice(totalSpent)}</strong>
            <span>Total spent</span>
          </div>
        </motion.div>
      </section>

      <section className="admin-customer-orders-section">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">ORDER HISTORY</span>
            <h2>Customer orders.</h2>
          </div>

          <span className="admin-section-count">
            {String(orders.length).padStart(2, "0")} ORDERS
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="admin-empty-state admin-customer-orders-empty">
            <span>00</span>
            <h3>No orders yet.</h3>
            <p>This customer has not placed an order with Auren.</p>
          </div>
        ) : (
          <div className="admin-customer-orders-table">
            <div className="admin-customer-orders-table-header">
              <span>ORDER</span>
              <span>DATE</span>
              <span>STATUS</span>
              <span>TOTAL</span>
              <span />
            </div>

            {orders.map((order) => (
              <motion.button
                key={order.id}
                type="button"
                className="admin-customer-order-row"
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                whileHover={{ x: 4 }}
              >
                <span className="admin-customer-order-number">
                  {getOrderNumber(order)}
                </span>

                <span>{formatDate(order.createdAt)}</span>

                <span>
                  <span
                    className={`admin-order-status ${getStatusClass(
                      order.status,
                    )}`}
                  >
                    {order.status || "Processing"}
                  </span>
                </span>

                <span className="admin-customer-order-total">
                  {formatPrice(order.total)}
                </span>

                <span className="admin-customer-order-arrow">↗</span>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminCustomerDetails;
