import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Preparing your workspace" 
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      {/* Logo with enhanced animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="mb-12"
      >
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="w-32 h-32 object-contain drop-shadow-lg"
        />
      </motion.div>

      {/* Enhanced Loading Animation */}
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-0 w-16 h-16 border-4 border-primary/40 rounded-full"
          animate={{ 
            scale: [1.1, 1.3, 1.1],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />

        {/* Inner spinning ring */}
        <motion.div
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: {
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      </div>

      {/* Subtitle Text with enhanced animation */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: 0.4,
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="mt-8 text-lg text-muted-foreground font-medium"
      >
        {message}
      </motion.p>

      {/* Decorative dots */}
      <div className="absolute bottom-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}; 