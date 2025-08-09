import { Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../usePageTitle";
import AnnouncementsSection from "../components/AnnouncementsSection";

function Home() {
  const features = [
    {
      title: "Awesome Teachers",
      icon: "images/icon1.png",
      content:
        "Passionate educators who ignite curiosity and go beyond the textbook",
    },
    {
      title: "Global Certificate",
      icon: "images/icon2.png",
      content:
        "Preparing students to stand confidently in the world with education",
    },
    {
      title: "Best Program",
      icon: "images/icon3.png",
      content: "Cultivating critical thinking and lifelong love for learning",
    },
    {
      title: "Student Support",
      icon: "images/icon4.png",
      content:
        "Safe space where every student is seen, understood, and empowered",
    },
  ];

  // const classes = [
  //     { name: 'Nursery', stage: 'Early Years', classes: 'Nursery 1 - 3', ageGroup: '2-5', image: 'images/school-campus.jpg' },
  //     { name: 'Kindergarten', stage: 'Foundation Stage', classes: 'KG 1 & 2', ageGroup: '5-6', image: 'images/school-campus.jpg' },
  //     { name: 'Primary', stage: 'Elementary Education', classes: 'Primary 1 - 6', ageGroup: '6-11', image: 'images/school-campus.jpg' },
  // ]

  return (
    <>
      {usePageTitle("Home")}
      <section className="main-banner py-16 lg:py-28 text-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-6/12 text-center md:text-left mb-10 md:mb-0">
              <div className="banner-text space-y-6" data-aos="fade-right">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">
                    Regina Nostra Schools
                  </h2>
                  <p className="text-lg text-gray-600 font-medium">
                    The Story • The Spirit • The Standard
                  </p>
                </div>

                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                  Nurturing Tomorrow's Leaders
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-blue-800">
                    With Heart & Wisdom
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-gray-600 max-w-2xl">
                  Since our founding in 2025, we've redefined Nigerian education
                  by cultivating
                  <strong>character</strong> alongside{" "}
                  <strong>competence</strong>. A legacy built on integrity,
                  curiosity, and the courage to think differently.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link
                    to="/Regina Nostra Schools- Pupil Application Form.pdf"
                    className="bg-[var(--color-primary)] hover:bg-blue-800 text-white px-5 py-3 rounded-lg text-md font-bold transition-all transform hover:scale-105 shadow-lg"
                    download
                    target="_blank"
                    title="Regina Nostra Schools- Pupil Application Form"
                  >
                    Download Application Form
                  </Link>
                  <Link
                    to="Regina Nostra Schools- Students' Prospectus.pdf"
                    className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-blue-50 px-5 py-3 rounded-lg text-md font-bold transition-all"
                    target="_blank"
                    title="Regina Nostra Schools- Students' Prospectus"
                  >
                    View Student Prospectus
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full md:w-6/12 relative">
              <div className="relative max-w-2xl" data-aos="fade-left">
                <img
                  src="/images/school-campus.jpg"
                  alt="Regina Nostra School Campus"
                  className="w-full h-auto rounded-2xl shadow-xl border-8 border-white transform hover:rotate-1 transition-transform duration-300"
                />

                <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="bg-[var(--color-primary)] p-2 rounded-full">
                      <i className="ti ti-star text-2xl text-white"></i>
                    </div>
                    <div>
                      <p className="font-bold text-lg">Since 2025</p>
                      <p className="text-sm text-gray-500">Legacy in Making</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-8 -right-8 bg-white p-4 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <i className="ti ti-school text-2xl text-green-600"></i>
                    </div>
                    <div>
                      <p className="font-bold text-lg">Exam Excellence</p>
                      <p className="text-sm text-gray-500">100% Pass Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <i className="ti ti-brain text-4xl text-[var(--color-primary)] mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Holistic Learning</h3>
              <p className="text-gray-600">
                Mind, character, and spirit development
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <i className="ti ti-heart-handshake text-4xl text-[var(--color-primary)] mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Nigerian Values</h3>
              <p className="text-gray-600">
                Rooted in integrity & community service
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <i className="ti ti-world text-4xl text-[var(--color-primary)] mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Global Standards</h3>
              <p className="text-gray-600">British/Nigerian curriculum blend</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <i className="ti ti-users text-4xl text-[var(--color-primary)] mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Family Community</h3>
              <p className="text-gray-600">Where every child is seen & heard</p>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20 lg:py-28 bg-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <header className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              A Message from Regina Nostra
            </h2>
            <div
              className="mx-auto w-24 h-1 bg-primary-500 rounded-full"
              aria-hidden="true"
            ></div>
          </header>

          <blockquote className="relative max-w-3xl mx-auto">
            {/* Opening quote */}
            <div
              className="absolute -top-5 left-0 transform -translate-y-2"
              aria-hidden="true"
            >
              <Quote className="w-12 h-12 text-gray-300" />
            </div>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed text-center italic">
              <span className="sr-only">Opening quotation mark</span>
              Too often, education becomes about grades and checklists. But what
              if school could be more? What if students were taught how to
              think, not just what to think? What if classrooms were not only
              spaces for learning, but also for becoming? These questions drove
              the founding of Regina Nostra Schools in 2025, ten years after its
              conception. It was never intended to be just another institution.
              It was designed to be a safe space, a place where students are not
              only taught, but seen, understood, and empowered.
              <span className="sr-only">Closing quotation mark</span>
            </p>

            {/* Closing quote */}
            <div
              className="absolute -bottom-4 right-0 transform translate-y-2"
              aria-hidden="true"
            >
              <Quote className="w-12 h-12 text-gray-300 transform rotate-180" />
            </div>
          </blockquote>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-[#F2F2F2] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="section-title text-center mb-12 lg:mb-20"
            data-aos="fade-up"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Regina Nostra Schools
              </span>
            </h2>
            <p
              className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Where Knowledge Meets Light - Embark on a journey of discovery and
              empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {features &&
              features.length &&
              features.map((feature, idx) => (
                <div
                  className="group relative bg-white rounded-2xl p-8 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:transform hover:-translate-y-2 shadow-lg hover:shadow-xl border border-gray-100/50 hover:border-transparent"
                  data-aos="fade-up"
                  data-aos-delay="150"
                  key={idx}
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-6 w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                      <img
                        src={feature.icon}
                        alt="Awesome Teachers"
                        className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-center text-base leading-relaxed">
                      {feature.content}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <AnnouncementsSection
        limit={6}
        showPinnedOnly={false}
        showCategory={true}
      />
    </>
  );
}

export default Home;
