import { Link } from "react-router-dom"

Link

function Cta() {
    return (
        <div className="text-center" data-aos="fade-up">
            <h3 className="text-2xl md:text-4xl font-semibold mb-4">Interested in Joining?</h3>
            <div className="flex justify-center gap-4">
                <Link
                    to="/admission"
                    className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
                >
                    Apply Now
                </Link>
                <Link
                    to="/contact"
                    className="border border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                    Contact Us
                </Link>
            </div>
        </div>
    )
}

export default Cta
