import { usePageTitle } from "../usePageTitle";

function Terms() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            {usePageTitle("Terms of Use")}

            <div className="max-w-4xl mx-auto" data-aos="fade-up">
                <h1 className="text-4xl font-bold mb-8 text-center">
                    Terms of Use
                </h1>

                <div className="prose prose-lg" data-aos="fade-up">
                    <h2>Acceptance of Terms</h2>
                    <p>
                        By accessing Regina Nostra Schools' website, you agree to comply with these terms.
                        If you disagree with any part, please refrain from using our site.
                    </p>

                    <h2>Intellectual Property</h2>
                    <p>
                        All content including logos, text, and images are property of Regina Nostra Schools.
                        Unauthorized use is prohibited.
                    </p>

                    <h2>User Responsibilities</h2>
                    <p>
                        You agree not to:
                    </p>
                    <ul>
                        <li>Misuse site content</li>
                        <li>Disrupt website functionality</li>
                        <li>Submit false information</li>
                    </ul>

                    <h2>Limitation of Liability</h2>
                    <p>
                        Regina Nostra Schools shall not be liable for:
                    </p>
                    <ul>
                        <li>Indirect damages arising from site use</li>
                        <li>Temporary site unavailability</li>
                        <li>Third-party content accuracy</li>
                    </ul>

                    <div className="mt-12 p-6 bg-gray-50 rounded-xl">
                        <p className="font-semibold">
                            These terms may be updated without notice. Continued use constitutes acceptance.
                        </p>
                        <p className="mt-4">
                            Effective: May 31, 2025
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Terms;