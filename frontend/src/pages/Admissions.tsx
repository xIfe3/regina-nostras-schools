import { usePageTitle } from "../usePageTitle"
import { Download } from "lucide-react"


function Admissions() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
            {usePageTitle("Admission")}

            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16" data-aos="fade-up">
                    <div className="inline-block px-4 py-2 bg-[var(--color-primary)]/10 rounded-full mb-6">
                        <span className="text-[var(--color-primary)] font-medium">2025 Intake Now Open</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                        Begin Your Educational Journey
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        At Regina Nostra, we nurture curious minds and develop future leaders through a holistic education approach.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href="#application-process"
                            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-[var(--color-alternate)] transition-colors shadow-md hover:shadow-lg"
                        >
                            Start Application
                        </a>
                    </div>
                </div>

                {/* Application Process Section */}
                <div
                    id="application-process"
                    className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16 border border-gray-100"
                    data-aos="fade-up"
                >
                    <div className="p-8 md:p-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Process</h2>
                            <div className="w-20 h-1 bg-[var(--color-primary)] mx-auto"></div>
                            <p className="text-gray-600 mt-4 max-w-xl mx-auto">
                                Download our application form and submit completed documents via email or in person
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Download Card */}
                            <div className="bg-gray-50 p-7 rounded-xl border border-gray-200">
                                <div className="flex items-start mb-5">
                                    <div className="bg-[var(--color-primary)]/10 p-3 rounded-lg mr-4 flex-shrink-0">
                                        <i className="ti ti-file-download text-[var(--color-primary)] text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Download Application Package</h3>
                                        <p className="text-gray-600 mb-4">Includes all required forms and instructions</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center">
                                                <i className="ti ti-file-text text-gray-400 mr-2"></i>
                                                <span>Application Form</span>
                                            </div>
                                            <div className="flex items-center">
                                                <i className="ti ti-checklist text-gray-400 mr-2"></i>
                                                <span>Requirements Checklist</span>
                                            </div>
                                            <div className="flex items-center">
                                                <i className="ti ti-coins text-gray-400 mr-2"></i>
                                                <span>Fee Structure</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href="Regina Nostra Schools- Pupil Application Form.pdf"
                                                download="Regina-Nostra-Application-Form.pdf"
                                                className="underline flex gap-2"
                                            >
                                                <Download size={20} /> Download Application Form
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submission Card */}
                            <div className="bg-gray-50 p-7 rounded-xl border border-gray-200">
                                <div className="flex items-start mb-5">
                                    <div className="bg-green-500/10 p-3 rounded-lg mr-4 flex-shrink-0">
                                        <i className="ti ti-send text-green-600 text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Submission Methods</h3>
                                        <p className="text-gray-600 mb-6">Choose your preferred submission method</p>

                                        <div className="space-y-5">
                                            <div className="flex items-start">
                                                <div className="bg-blue-100 p-2 rounded-lg mr-3 mt-1">
                                                    <i className="ti ti-mail text-blue-600"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Email Submission</h4>
                                                    <a
                                                        href="mailto:admissions@reginanostra.edu"
                                                        className="text-gray-600 hover:text-blue-600 transition-colors"
                                                    >
                                                        reginanostraschools@gmail.com
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="flex items-start">
                                                <div className="bg-purple-100 p-2 rounded-lg mr-3 mt-1">
                                                    <i className="ti ti-building-community text-purple-600"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">In-Person Delivery</h4>
                                                    <p className="text-gray-600">Admissions Office, Main Campus</p>
                                                    <p className="text-sm text-gray-500 mt-1">Mon-Fri, 8:30AM - 4:30PM</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
                    data-aos="fade-up"
                >
                    <div className="p-8 md:p-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
                            <div className="w-20 h-1 bg-[var(--color-primary)] mx-auto"></div>
                            <p className="text-gray-600 mt-4 max-w-xl mx-auto">
                                Common questions about our admissions process
                            </p>
                        </div>

                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* FAQ Item */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <button className="flex justify-between items-center w-full text-left p-5 bg-gray-50 hover:bg-gray-100 transition-colors group">
                                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--color-primary)]">
                                        What is the student-to-teacher ratio?
                                    </h4>
                                    <i className="ti ti-chevron-down text-gray-400 group-hover:text-[var(--color-primary)] transition-transform transform duration-300"></i>
                                </button>
                                <div className="p-5 bg-white">
                                    <p className="text-gray-600">
                                        Our average student-to-teacher ratio is 8:1 across all grade levels, with even lower ratios in our early years programs (5:1). This allows for personalized attention and differentiated instruction.
                                    </p>
                                </div>
                            </div>

                            {/* FAQ Item */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <button className="flex justify-between items-center w-full text-left p-5 bg-gray-50 hover:bg-gray-100 transition-colors group">
                                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--color-primary)]">
                                        What documents are required for application?
                                    </h4>
                                    <i className="ti ti-chevron-down text-gray-400 group-hover:text-[var(--color-primary)] transition-transform transform duration-300"></i>
                                </button>
                                <div className="p-5 bg-white">
                                    <p className="text-gray-600">
                                        Required documents include birth certificate, previous school transcripts, immunization records, and two recommendation letters. The complete checklist is included in the application package.
                                    </p>
                                </div>
                            </div>

                            {/* Support CTA */}
                            <div className="bg-[var(--color-primary)]/5 p-6 rounded-xl text-center mt-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-4">
                                    <i className="ti ti-headset text-2xl"></i>
                                </div>
                                <h4 className="text-xl font-semibold mb-3">Need more assistance?</h4>
                                <p className="text-gray-600 mb-5">Our admissions team is here to help with any questions</p>
                                <a
                                    href="mailto:reginanostraschools@gmail.com"
                                    className="inline-flex items-center text-[var(--color-primary)] font-semibold"
                                >
                                    <i className="ti ti-mail mr-2"></i> Contact Admissions
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Admissions
