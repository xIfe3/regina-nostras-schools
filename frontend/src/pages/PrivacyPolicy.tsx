import { usePageTitle } from "../usePageTitle";

function PrivacyPolicy() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            {usePageTitle("Privacy Policy")}

            <div className="max-w-4xl mx-auto" data-aos="fade-up">
                <h1 className="text-4xl font-bold mb-8 text-center">
                    Privacy Policy
                </h1>

                <div className="prose prose-lg" data-aos="fade-up">
                    <h2>Introduction</h2>
                    <p>
                        Regina Nostra Schools ("we", "our", "us") is committed to protecting your privacy.
                        This policy outlines how we collect, use, and safeguard your personal information.
                    </p>

                    <h2>Information Collection</h2>
                    <p>
                        We collect information when you:
                    </p>
                    <ul>
                        <li>Submit inquiry forms</li>
                        <li>Register for school events</li>
                        <li>Subscribe to our newsletter</li>
                    </ul>

                    <h2>Use of Information</h2>
                    <p>
                        Your information helps us to:
                    </p>
                    <ul>
                        <li>Respond to your inquiries</li>
                        <li>Improve our services</li>
                        <li>Send periodic updates</li>
                    </ul>

                    <h2>Data Security</h2>
                    <p>
                        We implement security measures including:
                    </p>
                    <ul>
                        <li>SSL encrypted connections</li>
                        <li>Restricted data access</li>
                        <li>Regular security audits</li>
                    </ul>

                    <div className="mt-12 p-6 bg-gray-50 rounded-xl">
                        <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                        <p>
                            For privacy concerns: <br />
                            <a href="mailto:privacy@reginanostra.sch" className="text-[var(--color-primary)]">
                                privacy@reginanostra.sch
                            </a>
                        </p>
                        <p className="mt-4">
                            Last updated: May 31, 2025
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PrivacyPolicy;