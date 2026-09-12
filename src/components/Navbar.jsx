import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Heart, ShoppingBag, UserRound, Menu, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, onSnapshot } from "firebase/firestore";

import { auth, db } from "../firebase";

function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let unsubscribeCart = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeCart) {
        unsubscribeCart();
        unsubscribeCart = null;
      }

      if (!currentUser) {
        setCartCount(0);
        return;
      }

      const cartRef = doc(db, "carts", currentUser.uid);

      unsubscribeCart = onSnapshot(
        cartRef,
        (cartSnapshot) => {
          if (cartSnapshot.exists()) {
            const items = cartSnapshot.data().items || [];

            const totalQuantity = items.reduce(
              (total, item) => total + (item.quantity || 0),
              0,
            );

            setCartCount(totalQuantity);
          } else {
            setCartCount(0);
          }
        },
        (error) => {
          console.error("Error listening to cart:", error);
          setCartCount(0);
        },
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeCart) {
        unsubscribeCart();
      }
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const openSearch = async () => {
    setMenuOpen(false);
    setSearchOpen(true);

    if (searchProducts.length > 0) {
      return;
    }

    setLoadingSearch(true);

    try {
      const productsSnapshot = await getDocs(collection(db, "products"));

      const products = productsSnapshot.docs.map((productDoc) => ({
        id: productDoc.id,
        ...productDoc.data(),
      }));

      setSearchProducts(products);
    } catch (error) {
      console.error("Error loading search products:", error);
      setSearchProducts([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchResult = (productId) => {
    closeSearch();
    navigate(`/product/${productId}`);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = normalizedQuery
    ? searchProducts.filter((product) => {
        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const description = String(product.description || "").toLowerCase();

        return (
          name.includes(normalizedQuery) ||
          category.includes(normalizedQuery) ||
          description.includes(normalizedQuery)
        );
      })
    : searchProducts.slice(0, 6);

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <Link to="/" className="logo" onClick={closeMenu}>
            AUREN
          </Link>

          <nav className="nav-links">
            <Link to="/shop">Shop</Link>
            <Link to="/collections">Collections</Link>
            <Link to="/journal">Journal</Link>
          </nav>

          <div className="nav-actions">
            <button
              className="nav-icon-button"
              aria-label="Search"
              onClick={openSearch}
            >
              <Search size={19} strokeWidth={1.5} />
            </button>

            <Link
              to="/wishlist"
              className="nav-icon-button"
              aria-label="Wishlist"
            >
              <Heart size={19} strokeWidth={1.5} />
            </Link>

            <Link
              to={user ? "/account" : "/login"}
              className="nav-icon-button"
              aria-label={user ? "Account" : "Login"}
            >
              <UserRound size={19} strokeWidth={1.5} />
            </Link>

            <Link
              to="/cart"
              className="nav-icon-button cart-button"
              aria-label="Shopping bag"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />

              <span className="navbar-cart-count">{cartCount}</span>
            </Link>

            <button
              className="mobile-menu-button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X size={22} strokeWidth={1.5} />
              ) : (
                <Menu size={22} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <nav className="mobile-menu-links">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <Link to="/shop" onClick={closeMenu}>
                    Shop
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.13 }}
                >
                  <Link to="/collections" onClick={closeMenu}>
                    Collections
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  <Link to="/journal" onClick={closeMenu}>
                    Journal
                  </Link>
                </motion.div>

                <div className="mobile-menu-divider" />

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.23 }}
                >
                  <Link to="/wishlist" onClick={closeMenu}>
                    Wishlist
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <Link to={user ? "/account" : "/login"} onClick={closeMenu}>
                    Account
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.33 }}
                >
                  <Link to="/cart" onClick={closeMenu}>
                    Cart
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================
          SEARCH OVERLAY
      ======================================== */}

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="navbar-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="navbar-search-panel"
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="navbar-search-top">
                <span className="navbar-search-label">AUREN / SEARCH</span>

                <button
                  className="navbar-search-close"
                  onClick={closeSearch}
                  aria-label="Close search"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              <div className="navbar-search-input-wrap">
                <Search size={22} strokeWidth={1.4} />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search objects..."
                  autoFocus
                />

                {searchQuery && (
                  <button
                    className="navbar-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>

              <div className="navbar-search-results">
                {loadingSearch ? (
                  <div className="navbar-search-state">
                    Loading collection...
                  </div>
                ) : normalizedQuery && filteredProducts.length === 0 ? (
                  <div className="navbar-search-state">
                    <strong>No objects found.</strong>
                    <span>Try another product name or collection.</span>
                  </div>
                ) : (
                  <>
                    <div className="navbar-search-results-header">
                      <span>
                        {normalizedQuery
                          ? "SEARCH RESULTS"
                          : "FEATURED OBJECTS"}
                      </span>

                      <span>
                        {String(filteredProducts.length).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="navbar-search-results-list">
                      {filteredProducts.map((product) => (
                        <button
                          className="navbar-search-result"
                          key={product.id}
                          onClick={() => handleSearchResult(product.id)}
                        >
                          <div className="navbar-search-result-image">
                            <img
                              src={product.image || "/products/product-01.jpg"}
                              alt={product.name}
                            />
                          </div>

                          <div className="navbar-search-result-info">
                            <span className="navbar-search-result-category">
                              {product.category || "AUREN"}
                            </span>

                            <span className="navbar-search-result-name">
                              {product.name}
                            </span>

                            <span className="navbar-search-result-price">
                              ${Number(product.price || 0).toFixed(2)}
                            </span>
                          </div>

                          <span className="navbar-search-result-arrow">↗</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
