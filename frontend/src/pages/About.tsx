import { usePageTitle } from "../usePageTitle"
import Cta from "../components/Cta"

function About() {
    const pillars = [
        { title: 'Academic Excellence', content: 'British-Nigerian curriculum fusion' },
        { title: 'Emotional Intelligence', content: 'Self-awareness & relationship building' },
        { title: 'Moral Foundation', content: 'Values-driven decision making' },
        { title: 'Global Citizenship', content: 'Cultural awareness & social responsibility' }
    ]

    const coreValues = [
        { letter: 'R', title: 'Respect', description: 'We treat everyone with kindness and dignity' },
        { letter: 'E', title: 'Excellence', description: 'We strive for the highest standards in all we do' },
        { letter: 'G', title: 'Growth', description: 'We embrace learning and development at every stage' },
        { letter: 'I', title: 'Integrity', description: 'We are honest, responsible, and principled' },
        { letter: 'N', title: 'Neatness', description: 'We value cleanliness, order, and self-discipline' },
        { letter: 'A', title: 'Appreciation', description: 'We recognize and celebrate people and opportunities with gratitude' }
    ]

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            {usePageTitle("About")}

            <div className="max-w-7xl mx-auto text-center mb-16" data-aos="fade-up">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    The Regina Nostra Story
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                    Where Legacy Meets Transformative Education
                </p>
                <div className="flex justify-center items-center space-x-4">
                    <div className="w-24 h-1 bg-[var(--color-primary)]"></div>
                    <span className="text-gray-500">Est. 2025</span>
                    <div className="w-24 h-1 bg-[var(--color-primary)]"></div>
                </div>
            </div>

            {/* Welcome Message Section */}
            <div className="max-w-7xl mx-auto mb-24 bg-white rounded-2xl shadow-lg p-8" data-aos="fade-up">
                <div className="grid md:grid-cols-1 gap-12 items-center">
                    <div>
                        <h3 className="text-3xl font-bold mb-6 text-gray-800">
                            Welcome Message from the Head of School
                        </h3>
                        <div className="space-y-4 text-gray-600">
                            <p className="font-medium">Dear Parents and Guardians,</p>
                            <p>Welcome to Regina Nostra Schools, a vibrant learning community where every child is known, valued, and guided to reach their full potential. We are committed to delivering quality, values-based education that nurtures the mind, heart, and spirit.</p>
                            <p>With our dedicated team, rich curriculum blend, and supportive environment, we invite you to be part of a school that truly partners with families in raising tomorrow's ethical and confident leaders.</p>
                            <div className="mt-8">
                                <p className="font-bold">Warm regards,</p>
                                <p className="font-bold">Chief Mrs Regina Nnajiofor,</p>
                                <p>Proprietress</p>
                            </div>
                        </div>
                    </div>
                    {/* <div className="flex justify-center">
                        <div className="relative">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-80 flex items-center justify-center text-gray-500">
                                Head of School Portrait
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-[var(--color-primary)] text-white py-2 px-6 rounded-lg">
                                <p className="font-bold">Proprietress</p>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>

            {/* About Regina Nostra Section */}
            <div className="max-w-7xl mx-auto mb-24 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6" data-aos="fade-right">
                    <h3 className="text-3xl font-bold text-gray-800 mb-6">
                        About Regina Nostra Schools
                    </h3>
                    <p className="text-lg text-gray-600">
                        Regina Nostra Schools is a private, co-educational day school located in Abakpa, Enugu. We serve children from Crèche to Primary 6, offering a well-rounded education grounded in:
                    </p>
                    <ul className="list-disc pl-6 text-lg text-gray-600 space-y-2">
                        <li>The Nigerian National Curriculum,</li>
                        <li>British curriculum enrichment, and</li>
                        <li>The Montessori method,</li>
                    </ul>
                    <p className="text-lg text-gray-600">
                        And rooted in Catholic Christian values.
                    </p>
                    <p className="text-lg text-gray-600">
                        Our small class sizes of a maximum of fifteen allows our pupils to learn in a safe, stimulating, and nurturing environment.
                    </p>
                </div>
                <div className="relative" data-aos="fade-left">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-80 flex items-center justify-center text-gray-500">
                        <img src="images/school-1.JPG" alt="School Campus" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-md">
                        <div className="flex items-center gap-2">
                            <i className="ti ti-school text-2xl text-[var(--color-primary)]"></i>
                            <span className="font-semibold">Abakpa, Enugu</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission and Vision Section */}
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 mb-24">
                <div className="bg-blue-50 p-8 rounded-2xl" data-aos="fade-right">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                            <i className="ti ti-target-arrow text-2xl"></i>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">Mission</h3>
                    </div>
                    <p className="text-lg text-gray-600">
                        To provide affordable, high-quality education that equips children with strong values, critical skills, and adaptable knowledge— through a blend of Nigerian, British, and Montessori approaches rooted in Catholic Christian principles.
                    </p>
                </div>

                <div className="bg-green-50 p-8 rounded-2xl" data-aos="fade-left">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                            <i className="ti ti-eye text-2xl"></i>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">Vision</h3>
                    </div>
                    <p className="text-lg text-gray-600">
                        To become a model of excellence in child-centred education— fostering a vibrant learning environment that nurtures character, inspires academic achievement, encourages community engagement, and prepares children to become innovative, ethical leaders.
                    </p>
                </div>
            </div>

            {/* Core Values Section */}
            <div className="max-w-7xl mx-auto mb-24" data-aos="fade-up">
                <div className="text-center mb-16">
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">
                        Core Values and Educational Philosophy
                    </h3>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Our school's philosophy can be summarized as Child-centred, values-driven, whole-child development in partnership with families.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {coreValues.map((value, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform duration-300 hover:scale-105"
                            data-aos="zoom-in"
                            data-aos-delay={index * 100}
                        >
                            <div className="w-16 h-16 mx-auto bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                                {value.letter}
                            </div>
                            <h4 className="text-xl font-bold mb-2">{value.title}</h4>
                            <p className="text-gray-600">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Existing Founding Story Section */}
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 mb-24 items-center">
                <div className="space-y-6" data-aos="fade-right">
                    <h3 className="text-3xl font-bold text-gray-800 mb-6">
                        From Vision to Reality
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Born from a 2015 vision to redefine education, Regina Nostra Schools opened its doors in 2025 with
                        a revolutionary approach. We reject the traditional focus on grades, choosing instead to cultivate
                        <span className="font-semibold text-[var(--color-primary)]"> critical thinkers</span> and
                        <span className="font-semibold text-[var(--color-primary)]"> compassionate leaders</span>.
                    </p>
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <p className="italic text-gray-700">
                            "Education should ignite potential, not just impart information."
                        </p>
                        <p className="mt-4 font-medium">
                            - Founder's Philosophy
                        </p>
                    </div>
                </div>
                <div className="relative" data-aos="fade-left">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-80 flex items-center justify-center text-gray-500">
                        <img src="images/school-campus.jpg" alt="School Campus" />
                    </div>
                    <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-md">
                        <div className="flex items-center gap-2">
                            <i className="ti ti-sparkles text-2xl text-[var(--color-primary)]"></i>
                            <span className="font-semibold">10 Year Vision</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Existing Four Pillars Section */}
            <div className="max-w-7xl mx-auto bg-gray-50 py-16 px-8 rounded-2xl mb-20" data-aos="fade-up">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-3xl font-bold mb-8">
                        Four Pillars of Holistic Development
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {pillars.map((pillar, idx) => (
                            <div className="p-6 bg-white rounded-xl shadow-lg" data-aos="zoom-in" key={idx}>
                                <i className="ti ti-brain text-4xl text-[var(--color-primary)] mb-4"></i>
                                <h4 className="text-xl font-bold mb-3">{pillar.title}</h4>
                                <p className="text-gray-600">{pillar.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Existing Quote Section */}
            <div className="max-w-7xl mx-auto relative bg-[var(--color-primary)] text-white py-20 px-8 rounded-2xl mb-20 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-cover bg-center"></div>
                <div className="max-w-4xl mx-auto text-center relative" data-aos="fade-up">
                    <i className="ti ti-quote text-5xl opacity-50 mb-8"></i>
                    <blockquote className="text-2xl md:text-3xl leading-relaxed font-medium mb-8 italic">
                        We don't just fill minds - we ignite purpose. Our students graduate not just ready for university,
                        but ready to impact their world.
                    </blockquote>
                    <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
                    <p className="text-lg">Regina Nostra Mission Statement</p>
                </div>
            </div>

            {/* Existing Four Points Section */}
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 mb-20">
                <div className="space-y-12" data-aos="fade-right">
                    <div className="flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                                1
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-3">Rooted in Nigeria</h4>
                            <p className="text-gray-600">Celebrating our cultural heritage while embracing global perspectives</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                                2
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-3">Innovative Pedagogy</h4>
                            <p className="text-gray-600">Blending Montessori principles with modern technology</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-12" data-aos="fade-left">
                    <div className="flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                                3
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-3">Safe Nurturing Spaces</h4>
                            <p className="text-gray-600">Purpose-built facilities designed for creative exploration</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                                4
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-3">Family Partnership</h4>
                            <p className="text-gray-600">Regular parent engagement through our Guardian Connect program</p>
                        </div>
                    </div>
                </div>
            </div>

            <Cta />
        </section>
    )
}

export default About