'use client'

import { motion } from 'framer-motion'
import { 
  FaNewspaper, 
  FaShoppingCart, 
  FaStar, 
  FaBalanceScale,
  FaRocket,
  FaSearch,
  FaCheckCircle,
  FaChartLine
} from 'react-icons/fa'

interface ContentTypeCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const contentTypes: ContentTypeCard[] = [
  {
    id: 'blog',
    title: 'Blog Post',
    description: 'Create engaging, SEO-optimized blog articles that rank and convert',
    icon: <FaNewspaper className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'product-review',
    title: 'Product Review',
    description: 'Generate detailed, authentic product reviews that build trust',
    icon: <FaStar className="w-8 h-8" />,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'comparison',
    title: 'Product Comparison',
    description: 'Create comprehensive comparison articles that help users decide',
    icon: <FaBalanceScale className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'affiliate',
    title: 'Affiliate Content',
    description: 'Craft persuasive affiliate pages that drive conversions',
    icon: <FaShoppingCart className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500'
  }
]

const features = [
  {
    icon: <FaRocket className="w-6 h-6" />,
    title: 'Lightning Fast',
    description: 'Generate quality content in seconds'
  },
  {
    icon: <FaSearch className="w-6 h-6" />,
    title: 'SEO Optimized',
    description: 'Automatic semantic and SERP optimization'
  },
  {
    icon: <FaCheckCircle className="w-6 h-6" />,
    title: 'AI Detection Proof',
    description: 'Humanized content that passes AI detectors'
  },
  {
    icon: <FaChartLine className="w-6 h-6" />,
    title: 'Conversion Focused',
    description: 'Content designed to engage and convert'
  }
]

interface DashboardProps {
  onContentTypeSelect: (type: string) => void
}

export default function Dashboard({ onContentTypeSelect }: DashboardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h2 className="text-5xl font-bold gradient-text">
          Welcome back to your Wand Wiser studio
        </h2>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto">
          Launch high-performing articles, product reviews, and conversion assets with curated workflows, SERP intelligence, and guided optimization.
        </p>
      </motion.div>

      {/* Content Types Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {contentTypes.map((type, index) => (
          <motion.div
            key={type.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onContentTypeSelect(type.id)}
            className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform duration-300`}
            >
              {type.icon}
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{type.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{type.description}</p>
            <div className="flex items-center text-indigo-600 font-semibold group-hover:gap-2 transition-all duration-300">
              <span>Launch workflow</span>
              <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm"
      >
        <h3 className="text-2xl font-bold text-center mb-8 gradient-text">
          Why teams choose Wand Wiser
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-center space-y-3"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200/60">
                {feature.icon}
              </div>
              <h4 className="font-semibold text-slate-900">{feature.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-slate-900 mb-2">10,000+</div>
          <div className="text-slate-500">Content pieces generated</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-slate-900 mb-2">95%</div>
          <div className="text-slate-500">AI detection pass rate</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-slate-900 mb-2">4.8/5</div>
          <div className="text-slate-500">Average user rating</div>
        </div>
      </motion.div>
    </div>
  )
}


