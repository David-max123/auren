import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Shop() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");



  const categories = [
    "All",
    "Signature Objects",
    "Home Essentials",
    "Everyday Forms",
    "Sculptural Forms",
  ];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));

        const productList = productsSnapshot.docs.map((productDoc) => ({
          id: productDoc.id,
          ...productDoc.data(),
        }));

        setProducts(productList);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setWishlist([]);
        return;
      }

      try {
        const wishlistRef = doc(db, "wishlists", currentUser.uid);

        const wishlistSnapshot = await getDoc(wishlistRef);

        if (wishlistSnapshot.exists()) {
          setWishlist(wishlistSnapshot.data().items || []);
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleWishlist = async (event, product) => {
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const wishlistRef = doc(db, "wishlists", user.uid);

      const wishlistSnapshot = await getDoc(wishlistRef);

      const currentWishlist = wishlistSnapshot.exists()
        ? wishlistSnapshot.data().items || []
        : [];

      const alreadySaved = currentWishlist.some(
        (item) => item.id === product.id,
      );

      let updatedWishlist;

      if (alreadySaved) {
        updatedWishlist = currentWishlist.filter(
          (item) => item.id !== product.id,
        );
      } else {
        updatedWishlist = [
          ...currentWishlist,
          {
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
          },
        ];
      }

      await setDoc(wishlistRef, {
        items: updatedWishlist,
      });

      setWishlist(updatedWishlist);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  const addToCart = async (event, product) => {
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(product.id);

      const cartRef = doc(db, "carts", user.uid);

      const cartSnapshot = await getDoc(cartRef);

      const currentCart = cartSnapshot.exists()
        ? cartSnapshot.data().items || []
        : [];

      const existingProduct = currentCart.find(
        (item) => item.id === product.id,
      );

      let updatedCart;

      if (existingProduct) {
        updatedCart = currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      } else {
        updatedCart = [
          ...currentCart,
          {
            id: product.id,
            name: product.name,
            category: product.category,
            price: Number(product.price),
            quantity: 1,
            image: product.image,
          },
        ];
      }

      await setDoc(cartRef, {
        items: updatedCart,
      });
    } catch (error) {
      console.error("Error adding product to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <main className="shop-page">
      <div className="container">
        {/* Header */}
        <motion.header
          className="shop-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="section-eyebrow">SHOP / 01</p>

            <h1>
              Everyday objects.
              <span>Considered differently.</span>
            </h1>
          </div>

          <p className="shop-description">
            Explore the Auren collection of thoughtfully designed objects,
            refined essentials, and distinctive forms created for modern living.
          </p>
        </motion.header>

        {/* Filters */}
        <motion.div
          className="shop-filters"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.15,
          }}
        >
          <div className="shop-filter-label">
            <span>FILTER</span>
            <span>{products.length.toString().padStart(2, "0")} PRODUCTS</span>
          </div>

          <div className="shop-category-list">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`shop-category ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product Grid */}
        <div className="shop-grid">
          {filteredProducts.map((product, index) => (
            <motion.article
              key={product.id}
              className="shop-product-card"
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="shop-product-image">
                <img src={product.image} alt={product.name} />

                <span className="shop-product-number">0{product.id}</span>

                {/* Wishlist Button */}
                <button
                  className={`shop-wishlist-button ${
                    isWishlisted(product.id) ? "active" : ""
                  }`}
                  aria-label={
                    isWishlisted(product.id)
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                  onClick={(event) => toggleWishlist(event, product)}
                >
                  <Heart
                    size={18}
                    strokeWidth={1.6}
                    fill={isWishlisted(product.id) ? "currentColor" : "none"}
                  />
                </button>

                {/* Add To Cart */}
                <button
                  className="shop-add-button"
                  disabled={addingToCart === product.id}
                  onClick={(event) => addToCart(event, product)}
                >
                  {addingToCart === product.id ? "Adding..." : "Add to cart"}
                </button>
              </div>

              <div className="shop-product-info">
                <div>
                  <h2>{product.name}</h2>

                  <p>{product.category}</p>
                </div>

                <span>${Number(product.price).toLocaleString()}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Shop;
