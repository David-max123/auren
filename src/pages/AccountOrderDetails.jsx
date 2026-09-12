import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, MapPin, Mail, Phone } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function AccountOrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError("Order not found.");
          setLoading(false);
          return;
        }

        const orderData = {
          id: orderSnap.id,
          ...orderSnap.data(),
        };

        // Make sure customers can only view their own orders
        if (orderData.userId !== currentUser.uid) {
          setError("You do not have permission to view this order.");
          setLoading(false);
          return;
        }

        setOrder(orderData);
      } catch (err) {
        console.error("Error loading order:", err);
        setError("Unable to load this order.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, orderId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Date unavailable";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getOrderNumber = () => {
    if (order?.orderNumber) {
      return order.orderNumber;
    }

    return `#AUR-${order?.id?.slice(0, 6).toUpperCase()}`;
  };

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-container">
          <p>Loading order...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="account-page">
        <div className="account-container">
          <button className="account-back" onClick={() => navigate("/account")}>
            <ArrowLeft size={18} />
            Back to Account
          </button>

          <div className="account-empty">
            <Package size={40} />
            <h2>Order unavailable</h2>
            <p>{error || "We couldn't find this order."}</p>
          </div>
        </div>
      </main>
    );
  }

  const items = order.items || [];
  const shippingAddress = order.shippingAddress || {};
  const customer = order.customer || {};

  return (
    <main className="account-page">
      <div className="account-container">
        <button className="account-back" onClick={() => navigate("/account")}>
          <ArrowLeft size={18} />
          Back to Account
        </button>

        <section className="account-order-header">
          <div>
            <span className="account-section-label">ORDER DETAILS</span>

            <h1>{getOrderNumber()}</h1>

            <p>Placed on {formatDate(order.createdAt)}</p>
          </div>

          <span
            className={`account-order-status status-${String(
              order.status || "Processing",
            )
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {order.status || "Processing"}
          </span>
        </section>

        <section className="account-detail-grid">
          {/* Products */}
          <div className="account-detail-card account-order-items">
            <div className="account-detail-card-header">
              <div>
                <span className="account-section-label">YOUR ORDER</span>
                <h2>Items</h2>
              </div>

              <Package size={22} />
            </div>

            <div className="account-items-list">
              {items.map((item, index) => (
                <div
                  className="account-order-item"
                  key={`${item.id || item.name}-${index}`}
                >
                  <div className="account-order-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>

                  <div className="account-order-item-info">
                    <h3>{item.name}</h3>

                    <p>{item.category}</p>

                    <span>Qty: {item.quantity}</span>
                  </div>

                  <strong>
                    $
                    {(
                      Number(item.price || 0) * Number(item.quantity || 0)
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              ))}
            </div>

            <div className="account-order-summary">
              <div>
                <span>Subtotal</span>
                <strong>${(Number(order.subtotal) || 0).toFixed(2)}</strong>
              </div>

              <div>
                <span>Shipping</span>
                <strong>
                  {Number(order.shipping) === 0
                    ? "Free"
                    : `$${Number(order.shipping).toFixed(2)}`}
                </strong>
              </div>

              <div className="account-order-total">
                <span>Total</span>
                <strong>${(Number(order.total) || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Customer information */}
          <div className="account-detail-card">
            <span className="account-section-label">CUSTOMER</span>

            <h2>Contact Information</h2>

            <div className="account-info-list">
              <div className="account-info-row">
                <Mail size={18} />
                <div>
                  <span>Email</span>
                  <p>{customer.email || user?.email}</p>
                </div>
              </div>

              {customer.phone && (
                <div className="account-info-row">
                  <Phone size={18} />
                  <div>
                    <span>Phone</span>
                    <p>{customer.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="account-detail-card">
            <span className="account-section-label">DELIVERY</span>

            <h2>Shipping Address</h2>

            <div className="account-info-list">
              <div className="account-info-row">
                <MapPin size={18} />

                <div>
                  <p>
                    {customer.firstName} {customer.lastName}
                  </p>

                  <p>{shippingAddress.address}</p>

                  <p>
                    {shippingAddress.city}
                    {shippingAddress.state ? `, ${shippingAddress.state}` : ""}
                  </p>

                  <p>{shippingAddress.postalCode}</p>

                  <p>{shippingAddress.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="account-detail-card">
            <span className="account-section-label">PAYMENT</span>

            <h2>Payment Information</h2>

            <div className="account-info-list">
              <div className="account-info-row">
                <div>
                  <span>Method</span>
                  <p>{order.payment?.method || "Demo Card"}</p>
                </div>
              </div>

              <div className="account-info-row">
                <div>
                  <span>Status</span>
                  <p>{order.payment?.status || "Demo Payment"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AccountOrderDetails;
