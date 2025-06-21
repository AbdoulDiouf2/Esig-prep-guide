import React from 'react';
import { motion, Variants } from 'framer-motion';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullScreen = true, 
  message = 'Chargement...' 
}) => {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const dot: Variants = {
    hidden: { y: '0%' },
    show: {
      y: ['0%', '-100%', '0%'],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut' as const, 
      },
    },
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div 
        className="flex space-x-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-blue-600 rounded-full"
            variants={dot}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#2563EB', 
            }}
          />
        ))}
      </motion.div>
      {message && (
        <motion.p 
          className="text-gray-600 dark:text-gray-300 mt-4 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
