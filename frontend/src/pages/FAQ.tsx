import { useState } from "react";
import { usePageTitle } from "../usePageTitle";

function FAQ() {
    const [openIndex, setOpenIndex] = useState<null | number>(null);

    const faqs = [
        {
            question: "What curriculum does Regina Nostra follow?",
            answer: "We blend the British National Curriculum with Nigerian educational standards, enhanced with Montessori principles for early years."
        },
        {
            question: "What are the school hours?",
            answer: "Regular hours: 8:00 AM - 3:00 PM. After-school care available until 5:30 PM."
        },
        {
            question: "Do you offer scholarship programs?",
            answer: "Yes, we offer merit-based scholarships covering up to 50% of tuition. Applications open every January."
        },
    ];

    const toggleFAQ = (index: null | number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            {usePageTitle("FAQ")}

            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-center">
                    Frequently Asked Questions
                </h1>
                <p className="text-xl text-gray-600 mb-12 text-center">
                    Find answers to common inquiries
                </p>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden"
                            data-aos="fade-up"
                        >
                            <button
                                className="flex justify-between items-center w-full p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                                onClick={() => toggleFAQ(index)}
                            >
                                <span className="text-xl font-medium">
                                    {faq.question}
                                </span>
                                <span className="ml-4 text-[var(--color-primary)] text-2xl">
                                    {openIndex === index ? '−' : '+'}
                                </span>
                            </button>

                            {openIndex === index && (
                                <div className="p-6 bg-gray-50 border-t border-gray-200">
                                    <p className="text-gray-700">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-8 bg-[var(--color-primary-light)] rounded-2xl text-center" data-aos="fade-up">
                    <h3 className="text-2xl font-bold mb-4">
                        Still have questions?
                    </h3>
                    <p className="mb-6">
                        Contact our admissions team for personalized assistance
                    </p>
                    <a
                        href="mailto:reginanostraschools@gmail.com"
                        className="inline-block bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Email Admissions
                    </a>
                </div>
            </div>
        </section>
    )
}

export default FAQ;