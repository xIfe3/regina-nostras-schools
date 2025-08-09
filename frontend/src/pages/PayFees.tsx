import { usePageTitle } from "../usePageTitle";

function SchoolFeesPayment() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            {usePageTitle("School Fees Payment")}

            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                    School Fees Payment Information
                </h2>

                <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
                    <h3 className="text-2xl font-bold mb-6 text-[var(--color-primary)]">
                        Bank Transfer Instructions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="border border-gray-200 rounded-lg p-6">
                            <h4 className="font-bold mb-2">Bank Details:</h4>
                            <div className="space-y-3">
                                <p><span className="font-semibold">Bank Name:</span> Zenith bank</p>
                                <p><span className="font-semibold">Account Name:</span> Regina Nostra Schools</p>
                                <p><span className="font-semibold">Account Number:</span> 1228417036</p>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-6">
                            <h4 className="font-bold mb-2">Payment Reference:</h4>
                            <p className="mb-4">Ensure the payment reference includes the student's full name, class & term/session:</p>
                            <div className="bg-gray-100 p-4 rounded-md">
                                <code className="text-sm">[Student Full Name] - [Class & Term/Session]</code>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-blue">
                        <h4 className="font-bold mb-2">Important Notes:</h4>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Please confirm the exact school fees amount with the school administration before making any payment.</li>
                            <li>Payments may take 1-3 business days to reflect.</li>
                            <li>Always keep your transaction receipt as proof of payment.</li>
                            <li>Send a confirmation email with the payment details to <a href="mailto:reginanostraschools@gmail.com">reginanostraschools@gmail.com</a></li>
                            <li>For any urgent questions, contact the accounts department: 07039265542, 09157736602</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Security Notice
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    Regina Nostra Schools will never ask for your banking credentials.
                                    Only make payments to the official school account listed above.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default SchoolFeesPayment;
