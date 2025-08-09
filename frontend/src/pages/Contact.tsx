import { Separator } from "@radix-ui/themes";
import { Mail, MapPin, Phone } from "lucide-react";
import { usePageTitle } from "../usePageTitle";
import { useState } from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../services/api";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await api.post("/contact", formData);
      alert(
        response.data.message ||
          "Thank you for contacting us! Your message has been sent successfully. We will get back to you soon."
      );
      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send message. Please try again later.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      {usePageTitle("Contact")}

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto py-24 w-full bg-[var(--color-primary)] rounded-2xl text-center space-y-4 mb-12 shadow-xl">
        <span className="inline-block py-3 px-6 text-[var(--color-primary)] bg-white font-semibold uppercase tracking-wide rounded-lg text-lg shadow-md">
          Write to Us
        </span>
        <h1 className="text-4xl md:text-6xl text-white font-bold mt-4">
          Get In Touch
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto mt-4">
          We're here to answer your questions and help you connect with our
          community
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-20">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Send Us a Message
              </h2>
              <p className="text-lg text-gray-600">
                Have questions? Fill out the form below and we'll get back to
                you within 24 hours
              </p>
            </div>

            <Separator size="4" className="bg-gray-200" />

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                  rows={5}
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="communication-terms"
                    className="mt-1 w-5 h-5 accent-[var(--color-primary)]"
                    required
                  />
                  <label
                    htmlFor="communication-terms"
                    className="text-sm text-gray-600"
                  >
                    I agree to receive communications from Regina Nostra School
                    *
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="data-consent"
                    className="mt-1 w-5 h-5 accent-[var(--color-primary)]"
                    required
                  />
                  <label
                    htmlFor="data-consent"
                    className="text-sm text-gray-600"
                  >
                    I consent to Regina Nostra School storing my personal data *
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--color-primary)] text-white font-semibold py-4 rounded-lg hover:bg-[var(--color-alternate)] transition-colors duration-300 shadow-md"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="aspect-video overflow-hidden rounded-xl shadow-lg">
              <img
                src="images/school-campus.jpg"
                alt="Regina Nostra School Campus"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Contact Information
              </h3>

              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="p-3 bg-[var(--color-primary)/10] rounded-lg text-[var(--color-primary)]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      General Inquiries
                    </h4>
                    <p className="text-gray-600">
                      <Link
                        to="mailto:reginanostraschools@gmail.com"
                        className="hover:text-[var(--color-primary)] transition-colors"
                      >
                        reginanostraschools@gmail.com
                      </Link>
                    </p>
                  </div>
                </li>

                <li className="flex gap-4 items-start">
                  <div className="p-3 bg-[var(--color-primary)/10] rounded-lg text-[var(--color-primary)]">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Phone Support
                    </h4>
                    <p className="text-gray-600 flex gap-1 items-center">
                      <Link
                        to="tel:+07039265542"
                        className="hover:text-[var(--color-primary)] transition-colors"
                      >
                        07039265542
                      </Link>
                      <Link
                        to="tel:+09157736602"
                        className="hover:text-[var(--color-primary)] transition-colors"
                      >
                        09157736602
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500">
                      Mon-Fri: 8:00 AM - 5:00 PM WAT
                    </p>
                  </div>
                </li>

                <li className="flex gap-4 items-start">
                  <div className="p-3 bg-[var(--color-primary)/10] rounded-lg text-[var(--color-primary)]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Headquarters
                    </h4>
                    <p className="text-gray-600">
                      12 CLEMENTS NNAKWE CLOSE, UGBENE, ABAKPA,
                    </p>
                    <p className="text-gray-600">ENUGU, Nigeria</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto text-center" data-aos="fade-up">
        <h3 className="text-3xl font-bold mb-6">See More of Our World</h3>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Follow us on social media to experience daily moments of inspiration,
          creativity, and growth in our school community.
        </p>
        <div className="flex justify-center gap-10">
          <div className="flex flex-col items-center">
            <Link
              to="#"
              className="text-[var(--color-primary)] hover:text-blue-800 transition-colors"
            >
              <FaInstagram className="text-3xl" />
            </Link>
            <span className="text-gray-600 mt-2">@ReginaNostraSchool</span>
          </div>
          <div className="flex flex-col items-center">
            <Link
              to="#"
              className="text-[var(--color-primary)] hover:text-blue-800 transition-colors"
            >
              <FaFacebook className="text-3xl" />
            </Link>
            <span className="text-gray-600 mt-2">/Regina Nostra</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
