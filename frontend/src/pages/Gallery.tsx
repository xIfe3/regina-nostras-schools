import { usePageTitle } from "../usePageTitle"
import Cta from "../components/Cta"

function Gallery() {
    const galleryImages = [
        { src: 'images/classroom-1.jpg', category: 'Class room' },
        { src: 'images/computer.JPG', category: 'Facilities' },
        { src: 'images/playground-1.JPG', category: 'Activities' },
        { src: 'images/IMG_2605.JPG', category: 'Class room' },
        { src: 'images/school.JPG', category: 'Events' },
        { src: 'images/daycare-1.JPG', category: 'Facilities' },
        { src: 'images/school-campus.jpg', category: 'Campus Life' },
    ]

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            {usePageTitle("Gallery")}

            <div className="max-w-7xl mx-auto text-center mb-16" data-aos="fade-up">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Life at Regina Nostra
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                    Where Learning Comes Alive
                </p>
                <div className="flex justify-center items-center space-x-4">
                    <div className="w-24 h-1 bg-[var(--color-primary)]"></div>
                    <span className="text-gray-500">Through The Lens</span>
                    <div className="w-24 h-1 bg-[var(--color-primary)]"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-20" data-aos="fade-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {galleryImages.map((image, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                            data-aos="zoom-in"
                        >
                            <img
                                src={image.src}
                                alt={image.category}
                                className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white font-medium text-lg">
                                    {image.category}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Cta />
        </section>
    )
}

export default Gallery