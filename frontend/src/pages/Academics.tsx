import Cta from "../components/Cta"
import { usePageTitle } from "../usePageTitle"

function Academics() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            {usePageTitle("Academics")}

            <div className="max-w-7xl mx-auto text-center mb-20" data-aos="fade-up">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                    Our Academic Pathway
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    From First Steps to Primary Excellence - Nurturing Young Minds
                </p>
                <div className="flex justify-center items-center space-x-4">
                    <div className="w-16 md:w-24 h-1 bg-[var(--color-primary)]"></div>
                    <span className="text-gray-500">Age 1 - 11 Years</span>
                    <div className="w-16 md:w-24 h-1 bg-[var(--color-primary)]"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-24">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Early Years Card */}
                    <div className="relative group" data-aos="zoom-in">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl h-full transform transition duration-500 group-hover:scale-[1.02] shadow-lg border border-blue-100">
                            <div className="flex items-center gap-4 mb-6">
                                <i className="ti ti-building-castle text-4xl text-[var(--color-primary)]"></i>
                                <h3 className="text-2xl font-bold">Early Years Foundation</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <i className="ti ti-baby-carriage text-blue-600"></i>
                                        </div>
                                        <span className="font-medium">Daycare</span>
                                    </div>
                                    <span className="text-sm text-[var(--color-primary)] font-medium px-3 py-1 bg-blue-50 rounded-full">1-2 Years</span>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <i className="ti ti-puzzle text-green-600"></i>
                                        </div>
                                        <span className="font-medium">Preschool</span>
                                    </div>
                                    <span className="text-sm text-[var(--color-primary)] font-medium px-3 py-1 bg-green-50 rounded-full">2-3 Years</span>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-blue-100 shadow-sm transition hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <i className="ti ti-pencil text-yellow-600"></i>
                                        </div>
                                        <span className="font-medium">Kindergarten</span>
                                    </div>
                                    <span className="text-sm text-[var(--color-primary)] font-medium px-3 py-1 bg-yellow-50 rounded-full">3-5 Years</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-blue-100">
                                <h4 className="font-bold mb-3 text-gray-700">Learning Approach</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Montessori</span>
                                    <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">Play-based</span>
                                    <span className="text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded-full">Sensory Activities</span>
                                    <span className="text-xs px-3 py-1 bg-pink-100 text-pink-800 rounded-full">Social Development</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Primary School Card */}
                    <div className="relative group" data-aos="zoom-in" data-aos-delay="100">
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-2xl h-full transform transition duration-500 group-hover:scale-[1.02] shadow-lg border border-green-100">
                            <div className="flex items-center gap-4 mb-6">
                                <i className="ti ti-school text-4xl text-[var(--color-primary)]"></i>
                                <h3 className="text-2xl font-bold">Primary Education</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="col-span-2 bg-white p-4 rounded-lg border border-green-100 text-center shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                            <i className="ti ti-seeding text-green-600"></i>
                                        </div>
                                    </div>
                                    <span className="block font-medium">Foundation Years</span>
                                    <span className="text-sm text-[var(--color-primary)] font-medium">Primary 1-3</span>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-green-100 text-center shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <i className="ti ti-book text-blue-600"></i>
                                        </div>
                                    </div>
                                    <span className="block">Primary 4</span>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-green-100 text-center shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <i className="ti ti-microscope text-yellow-600"></i>
                                        </div>
                                    </div>
                                    <span className="block">Primary 5</span>
                                </div>

                                <div className="col-span-2 bg-white p-4 rounded-lg border border-green-100 text-center shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                            <i className="ti ti-stars text-purple-600"></i>
                                        </div>
                                    </div>
                                    <span className="block font-medium">Transition Class</span>
                                    <span className="text-sm text-[var(--color-primary)] font-medium">Primary 6</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-bold mb-3 text-gray-700">Curriculum Blend</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">Nigerian Curriculum</span>
                                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">British Enrichment</span>
                                    <span className="text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded-full">Catholic Values</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-24" data-aos="fade-up">
                <h3 className="text-3xl font-bold text-center mb-16">Our Progressive Learning Journey</h3>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl flex-1 border border-blue-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xl font-bold">
                                1
                            </div>
                            <h4 className="text-xl font-bold">Discovery Phase</h4>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Sensory play, language development, and social skills through Montessori-inspired activities.
                        </p>
                        <div className="flex items-center">
                            <i className="ti ti-map-pin text-blue-500 mr-2"></i>
                            <span className="text-sm text-[var(--color-primary)] font-medium">Daycare - Kindergarten</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-2xl flex-1 border border-green-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xl font-bold">
                                2
                            </div>
                            <h4 className="text-xl font-bold">Foundation Building</h4>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Core literacy and numeracy skills development with Nigerian curriculum fundamentals.
                        </p>
                        <div className="flex items-center">
                            <i className="ti ti-map-pin text-green-500 mr-2"></i>
                            <span className="text-sm text-[var(--color-primary)] font-medium">Primary 1-3</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-8 rounded-2xl flex-1 border border-amber-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xl font-bold">
                                3
                            </div>
                            <h4 className="text-xl font-bold">Skill Development</h4>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Critical thinking, creativity, and preparation for secondary education transition.
                        </p>
                        <div className="flex items-center">
                            <i className="ti ti-map-pin text-amber-500 mr-2"></i>
                            <span className="text-sm text-[var(--color-primary)] font-medium">Primary 4-6</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-white p-12 rounded-2xl mb-24 border border-gray-100 shadow-sm" data-aos="fade-up">
                <h3 className="text-3xl font-bold text-center mb-12">Comprehensive Curriculum</h3>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-xl border border-blue-100 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                            <i className="ti ti-books text-3xl text-[var(--color-primary)]"></i>
                            <h4 className="text-xl font-bold">Core Academics</h4>
                        </div>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Mathematics & Sciences</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>English Language Arts</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Nigerian History & Culture</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>French Language Introduction</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>ICT & Digital Literacy</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-purple-100 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                            <i className="ti ti-palette text-3xl text-[var(--color-primary)]"></i>
                            <h4 className="text-xl font-bold">Creative Development</h4>
                        </div>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Visual Arts Program</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Music & Movement</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Drama & Storytelling</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Cultural Dance</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Creative Writing Workshops</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-green-100 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                            <i className="ti ti-olympics text-3xl text-[var(--color-primary)]"></i>
                            <h4 className="text-xl font-bold">Physical & Social Growth</h4>
                        </div>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Physical Education</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Team Sports Development</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Mindfulness & Yoga</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Health & Nutrition Education</span>
                            </li>
                            <li className="flex items-start">
                                <i className="ti ti-check text-green-500 mt-1 mr-3"></i>
                                <span>Social Responsibility Projects</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-200 max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-white p-4 rounded-full shadow-md">
                            <i className="ti ti-stars text-4xl text-[var(--color-primary)]"></i>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-2">Character & Values Education</h4>
                            <p className="text-gray-600">
                                Integrated REGINA values program focusing on Respect, Excellence, Growth, Integrity, Neatness,
                                and Appreciation through daily activities and special curriculum modules.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Cta />
        </section>
    )
}

export default Academics
