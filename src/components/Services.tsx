// src/components/Services.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCut,
  faPaintBrush,
  faSpa,
  faFire,
  faChild,
  faEllipsisH,
} from '@fortawesome/free-solid-svg-icons'

const services = [
  {
    name: 'Haircut & Style',
    description: 'Professional haircut with blow dry and styling to perfection.',
    duration: '60 min',
    price: '$65',
    icon: faCut,
  },
  {
    name: 'Full Color',
    description: 'Complete hair color service with premium products and conditioning.',
    duration: '120 min',
    price: '$120',
    icon: faPaintBrush,
  },
  {
    name: 'Hair Treatment',
    description: 'Deep conditioning treatment to restore moisture and shine.',
    duration: '45 min',
    price: '$55',
    icon: faSpa,
  },
  {
    name: 'Balayage',
    description: 'Hand-painted highlights for a natural, sun-kissed look.',
    duration: '180 min',
    price: '$200',
    icon: faFire,
  },
  {
    name: 'Kids Cut',
    description: 'Special haircut service for children under 12 years old.',
    duration: '30 min',
    price: '$40',
    icon: faChild,
  },
  {
    name: 'Extensions',
    description: 'Premium hair extensions for instant length and volume.',
    duration: '240 min',
    price: '$350+',
    icon: faEllipsisH,
  },
]

export default function Services() {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <h2 className="font-heading text-3xl font-bold text-center text-primary-800 mb-12">
          Our Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.name}
              className="bg-primary-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <div className="bg-secondary-100 p-3 rounded-full mr-4">
                  <FontAwesomeIcon icon={service.icon} className="text-secondary-500 text-xl" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-primary-800">
                  {service.name}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{service.duration}</span>
                <span className="font-medium text-primary-700">{service.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
