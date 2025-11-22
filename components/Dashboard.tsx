'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  FaNewspaper, 
  FaShoppingCart, 
  FaStar, 
  FaBalanceScale,
  FaFolderOpen,
  FaLink,
  FaUsers,
  FaFileAlt
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

interface QuickLink {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  onClick?: () => void
  href?: string
}

interface DashboardProps {
  onContentTypeSelect: (type: string) => void
  onSectionChange?: (section: 'projects' | 'personas' | 'contents') => void
}

export default function Dashboard({ onContentTypeSelect, onSectionChange }: DashboardProps) {
  const router = useRouter()
  
  const quickLinks: QuickLink[] = [
    {
      id: 'contents',
      title: 'Contents',
      description: 'Browse and manage all your content',
      icon: <FaFileAlt className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-500',
      onClick: () => router.push('/contents')
    },
    {
      id: 'projects',
      title: 'Projects',
      description: 'Organize your content into projects',
      icon: <FaFolderOpen className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      onClick: () => onSectionChange?.('projects')
    },
    {
      id: 'personas',
      title: 'Personas',
      description: 'Manage your writing personas',
      icon: <FaUsers className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      onClick: () => onSectionChange?.('personas')
    },
    {
      id: 'connections',
      title: 'Connections',
      description: 'Connect to WordPress and other platforms (Coming Soon)',
      icon: <FaLink className="w-6 h-6" />,
      color: 'from-slate-400 to-slate-500',
    }
  ]
  
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
          Welcome back to your ProAI Writer studio
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
        {contentTypes.map(type => (
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

      {/* Quick Links Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-2xl font-bold mb-6 text-slate-900">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link) => (
            <motion.div
              key={link.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={link.onClick}
              className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg ${
                link.id === 'connections' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white mb-4`}>
                {link.icon}
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">{link.title}</h4>
              <p className="text-sm text-slate-500">{link.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}


