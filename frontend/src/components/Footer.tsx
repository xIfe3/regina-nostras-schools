import { Copyright } from "lucide-react";
import { FaFacebook, FaInstagram, FaEnvelope, FaPhone } from "react-icons/fa";
import { Link } from "react-router-dom";

const Listitem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">{children}</div>
);

function Footer() {
  const getYear = new Date().getFullYear();
  return (
    <footer className="py-12 bg-[url('/images/footer-bg.jpg')] relative bg-bottom">
      <div className="w-full h-full absolute bg-black/50 top-0"></div>

      <div className="relative z-25 max-w-7xl mx-auto space-y-10">
        <div className="p-5 flex items-center justify-center">
          <h3 className="text-gray-300/50 text-6xl md:text-9xl font-bold">
            Regina Nostra
          </h3>
        </div>

        <div className="flex md:flex-row flex-col justify-between">
          <div className="space-y-3 w-full md:w-1/2 flex flex-col md:items-start items-center md:mb-0 mb-10">
            <img
              src="/images/logo.png"
              alt="Regina Nostra Logo"
              className="h-34 w-auto"
            />
            <h2 className="text-lg font-bold text-gray-100">
              Inspirando Excellentiam
            </h2>
          </div>

          <div className="w-full md:w-1/2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-medium text-gray-100">
            <div>
              <ul className="space-y-3 md:text-start text-center">
                <li>
                  <Link to="/about">About</Link>
                </li>
                <li>
                  <Link to="/academics">Academics</Link>
                </li>
                <li>
                  <Link to="/admission">Admission</Link>
                </li>
                <li>
                  <Link to="/gallery">Gallery</Link>
                </li>
                <li>
                  <Link to="/pay-fees">Pay School Fees</Link>
                </li>
              </ul>
            </div>

            <div>
              <ul className="space-y-3 md:text-start text-center">
                <li>
                  <Link to="/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms">Terms of Use</Link>
                </li>
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                <li>
                  <Link to="/login">Login</Link>
                </li>
              </ul>
            </div>

            <div>
              <ul className="space-y-3 flex flex-col md:items-start items-center">
                <Listitem>
                  <FaInstagram /> reginanostraschools
                </Listitem>
                <Listitem>
                  <FaFacebook /> Regina Nostra
                </Listitem>
                <Listitem>
                  <FaEnvelope /> reginanostraschools@gmail.com
                </Listitem>
                <Listitem>
                  <FaPhone /> 07039265542, 09157736602
                </Listitem>
              </ul>
            </div>
          </div>
        </div>

        <div className="py-5">
          <ul className="flex items-center justify-end md:space-x-8 md:flex-row flex-col space-x-0 text-gray-100 font-medium">
            <li className="flex gap-1 items-center">
              <Copyright size={20} />
              {getYear} Regina Nostra Schools. All rights reserved
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms of Use</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
