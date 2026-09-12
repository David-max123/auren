import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowUp } from "lucide-react";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <p className="footer-eyebrow">AUREN / 2026</p>

          <h2>AUREN</h2>

          <p className="footer-tagline">
            Modern luxury,
            <span>made personal.</span>
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-links">
          <div className="footer-link-group">
            <h3>Shop</h3>

            <Link to="/shop">
              All Products
              <ArrowUpRight size={13} />
            </Link>

            <Link to="/collections">
              Collections
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="footer-link-group">
            <h3>Account</h3>

            <Link to="/login">
              Login
              <ArrowUpRight size={13} />
            </Link>

            <Link to="/register">
              Create Account
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Back to top */}
        <button
          className="footer-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <span>Back to top</span>
          <ArrowUp size={15} strokeWidth={1.5} />
        </button>
      </div>

      <div className="footer-bottom">
        <p>© 2026 AUREN. All rights reserved.</p>

        <p className="footer-bottom-note">Designed with intention.</p>
      </div>
    </footer>
  );
}

export default Footer;
