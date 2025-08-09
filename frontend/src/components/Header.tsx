import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    // Close the mobile menu when the route changes
    setIsMobileOpen(false);
  }, [location]);

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      <nav className="relative py-4 max-w-7xl mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-fit gap-12">
            <div className="hidden lg:flex items-center space-x-6 text-xl">
              <Link
                to="/about"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/academics"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                Academics
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/admission"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                Admissions
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
            </div>

            <div className="flex-shrink-0 mx-4 lg:mx-0">
              <Link to="/" className="block">
                <img
                  src="/images/logo.png"
                  alt="Regina Nostra"
                  className="h-20 md:h-40 w-auto"
                />
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              <Link
                to="/gallery"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                Gallery
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/pay-fees"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                Pay School Fees
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/login"
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                Login
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/admission"
                className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full hover:bg-blue-800 transition-colors"
              >
                Apply
              </Link>
            </div>

            <div className="lg:hidden">
              <button
                id="mobile-menu-button"
                type="button"
                className="text-gray-700 hover:text-[var(--color-primary)] focus:outline-none cursor-pointer"
                onClick={toggleMobile}
              >
                <span className="sr-only">Open menu</span>
                <Menu />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`${
          isMobileOpen ? "block -translate-x-0" : "hidden -translate-x-full"
        } fixed inset-0 z-50 bg-white transform  transition-transform duration-300`}
      >
        <div className="flex justify-between items-center px-6 py-4">
          <img src="/images/logo.png" alt="Logo" className="h-12" />
          <button
            className="text-gray-700 cursor-pointer"
            onClick={toggleMobile}
          >
            <X />
          </button>
        </div>
        <div className="px-6 py-4">
          <nav className="space-y-4">
            <Link
              to="/"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              About
            </Link>
            <Link
              to="/academics"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Academics
            </Link>
            <Link
              to="/gallery"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Gallery
            </Link>
            <Link
              to="/admission"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Admissions
            </Link>
            <Link
              to="/contact"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Contact
            </Link>
            <Link
              to="/pay-fees"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Pay School Fees
            </Link>
            <Link
              to="/login"
              className="block text-gray-700 hover:text-[var(--color-primary)] text-lg"
            >
              Login
            </Link>
            <Link
              to="/admission"
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full hover:bg-blue-800 transition-colors"
            >
              Apply
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
