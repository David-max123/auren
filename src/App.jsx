import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Journal from "./pages/Journal";
import JournalArticle from "./pages/JournalArticle";
import Collections from "./pages/Collections";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import AdminCustomers from "./pages/AdminCustomers";
import AdminCustomerDetails from "./pages/AdminCustomerDetails";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import AdminProducts from "./pages/AdminProducts";
import AdminProductForm from "./pages/AdminProductForm";
import AccountOrderDetails from "./pages/AccountOrderDetails";


function ScrollToTop() {
  const { pathname } = useLocation();

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:id" element={<JournalArticle />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route
            path="/account/orders/:orderId"
            element={<AccountOrderDetails />}
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route
            path="/admin/customers/:customerId"
            element={<AdminCustomerDetails />}
          />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route
            path="/admin/orders/:orderId"
            element={<AdminOrderDetails />}
          />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />

          <Route
            path="/admin/products/:productId/edit"
            element={<AdminProductForm />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
