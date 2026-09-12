import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { motion } from "motion/react";

import { auth, db } from "../firebase";

function AdminCustomers() {
  const navigate = useNavigate();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));

        if (!userSnapshot.exists() || userSnapshot.data().role !== "admin") {
          navigate("/");
          return;
        }

        if (mounted) {
          setCheckingAccess(false);
        }

        const [usersSnapshot, ordersSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders")),
        ]);

        const customerList = usersSnapshot.docs
          .map((userDoc) => ({
            id: userDoc.id,
            ...userDoc.data(),
          }))
          .filter((customer) => customer.role !== "admin");

        const orderList = ordersSnapshot.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        }));

        customerList.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        });

        if (mounted) {
          setCustomers(customerList);
          setOrders(orderList);
        }
      } catch (error) {
        console.error("Error loading customers:", error);

        if (mounted) {
          setCustomers([]);
          setOrders([]);
        }
      } finally {
        if (mounted) {
          setCheckingAccess(false);
          setLoadingCustomers(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigate]);

  const getCustomerName = (customer) => {
    const fullName = `${customer.firstName || ""} ${
      customer.lastName || ""
    }`.trim();

    return fullName || customer.displayName || "Unnamed customer";
  };

  const getOrderCustomer = (order) => {
    return order.customer || {};
  };

  const getCustomerOrderCount = (customer) => {
    return orders.filter((order) => {
      const orderCustomer = getOrderCustomer(order);

      const customerId =
        orderCustomer.uid ||
        orderCustomer.userId ||
        orderCustomer.id ||
        order.uid ||
        order.userId;

      const customerEmail = orderCustomer.email || order.email || "";

      if (customerId && customerId === customer.id) {
        return true;
      }

      if (
        customerEmail &&
        customer.email &&
        customerEmail.toLowerCase() === customer.email.toLowerCase()
      ) {
        return true;
      }

      return false;
    }).length;
  };

  const totalCustomers = customers.length;

  const customerSummary = useMemo(() => {
    const withOrders = customers.filter(
      (customer) => getCustomerOrderCount(customer) > 0,
    ).length;

    return {
      total: totalCustomers,
      withOrders,
      withoutOrders: totalCustomers - withOrders,
    };
  }, [customers, orders]);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    let date;

    if (dateValue?.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (checkingAccess) {
    return (
      <main className="admin-page admin-customers-page">
        <div className="container">
          <div className="admin-loading-state">
            <span>Checking access...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page admin-customers-page">
      <div className="container">
        <motion.div
          className="admin-page-header admin-customers-header"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="admin-header-content">
            <div>
              <div className="admin-header-title-row">
                <p className="section-eyebrow">AUREN / ADMIN</p>
                <span className="admin-header-index">02</span>
              </div>

              <h1>Customers.</h1>

              <div className="admin-header-line" />

              <p>View and manage everyone who has created an Auren account.</p>
            </div>

            <button
              className="admin-store-link"
              onClick={() => navigate("/admin")}
            >
              <span>Back to dashboard</span>
              <span className="admin-store-link-arrow">↖</span>
            </button>
          </div>
        </motion.div>

        <motion.section
          className="admin-customer-summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="admin-customer-summary-card admin-customer-summary-featured">
            <span className="admin-summary-label">TOTAL CUSTOMERS</span>
            <strong>{String(customerSummary.total).padStart(2, "0")}</strong>
            <span className="admin-summary-caption">Registered accounts</span>
          </div>

          <div className="admin-customer-summary-card">
            <span className="admin-summary-label">WITH ORDERS</span>
            <strong>
              {String(customerSummary.withOrders).padStart(2, "0")}
            </strong>
            <span className="admin-summary-caption">
              Customers who purchased
            </span>
          </div>

          <div className="admin-customer-summary-card">
            <span className="admin-summary-label">NO ORDERS</span>
            <strong>
              {String(customerSummary.withoutOrders).padStart(2, "0")}
            </strong>
            <span className="admin-summary-caption">
              Registered but inactive
            </span>
          </div>
        </motion.section>

        <section className="admin-customers-section">
          <div className="admin-section-heading">
            <div>
              <p className="section-eyebrow">CUSTOMER DIRECTORY</p>
              <h2>All registered customers.</h2>
            </div>

            <span className="admin-section-count">
              {String(totalCustomers).padStart(2, "0")} ACCOUNTS
            </span>
          </div>

          {loadingCustomers ? (
            <div className="admin-loading-state">
              <span>Loading customers...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="admin-empty-state">
              <span>00</span>
              <h3>No customers yet.</h3>
              <p>Registered customer accounts will appear here.</p>
            </div>
          ) : (
            <motion.div
              className="admin-customers-table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="admin-customers-table-header">
                <span>CUSTOMER</span>
                <span>EMAIL</span>
                <span>JOINED</span>
                <span>ORDERS</span>
              </div>

              {customers.map((customer, index) => {
                const orderCount = getCustomerOrderCount(customer);

                return (
                  <motion.button
                    type="button"
                    className="admin-customer-row"
                    key={customer.id}
                    onClick={() => navigate(`/admin/customers/${customer.id}`)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.04 * index,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="admin-customer-identity">
                      <div className="admin-customer-avatar">
                        {getCustomerName(customer).charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{getCustomerName(customer)}</strong>
                        <span>
                          Customer #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    <div className="admin-customer-email">
                      {customer.email || "No email"}
                    </div>

                    <div className="admin-customer-date">
                      {formatDate(customer.createdAt)}
                    </div>

                    <div className="admin-customer-orders">
                      <strong>{String(orderCount).padStart(2, "0")}</strong>
                      <span>{orderCount === 1 ? "order" : "orders"}</span>
                    </div>

                    <span className="admin-customer-row-arrow">↗</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminCustomers;
