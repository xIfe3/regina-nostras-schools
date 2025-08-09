import React from "react";
import { motion } from "framer-motion";

/**
 * Loading Component Props Interface
 */
interface LoadingProps {
  /** Loading text to display */
  text?: string;
  /** Size variant of the loading spinner */
  size?: "sm" | "md" | "lg";
  /** Whether to show a full page overlay */
  fullPage?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Whether to show the loading text */
  showText?: boolean;
}

/**
 * Production-Ready Loading Component
 * Provides consistent loading states across the application
 * Includes accessibility features and smooth animations
 */
const Loading: React.FC<LoadingProps> = ({
  text = "Loading...",
  size = "md",
  fullPage = false,
  className = "",
  showText = true,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: "h-6 w-6",
      text: "text-sm",
      container: "space-y-2",
    },
    md: {
      spinner: "h-8 w-8",
      text: "text-base",
      container: "space-y-3",
    },
    lg: {
      spinner: "h-12 w-12",
      text: "text-lg",
      container: "space-y-4",
    },
  };

  const config = sizeConfig[size];

  /**
   * Spinner animation variants for framer-motion
   */
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  /**
   * Text animation variants for accessibility
   */
  const textVariants = {
    initial: { opacity: 0.7 },
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const LoadingContent = () => (
    <div
      className={`flex flex-col items-center justify-center ${config.container} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {/* Spinner */}
      <motion.div
        className={`${config.spinner} border-4 border-gray-200 border-t-green-600 rounded-full`}
        variants={spinnerVariants}
        animate="animate"
        aria-hidden="true"
      />

      {/* Loading text */}
      {showText && (
        <motion.p
          className={`${config.text} text-gray-600 font-medium`}
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          {text}
        </motion.p>
      )}

      {/* Screen reader only text */}
      <span className="sr-only">Content is loading, please wait...</span>
    </div>
  );

  // Full page overlay version
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
          <LoadingContent />
        </div>
      </div>
    );
  }

  // Inline version
  return <LoadingContent />;
};

/**
 * Skeleton Loading Component for content placeholders
 */
interface SkeletonProps {
  /** Width of the skeleton */
  width?: string;
  /** Height of the skeleton */
  height?: string;
  /** Custom className */
  className?: string;
  /** Whether the skeleton is circular */
  circular?: boolean;
  /** Number of lines for text skeletons */
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "1rem",
  className = "",
  circular = false,
  lines = 1,
}) => {
  const skeletonStyle = {
    width,
    height: circular ? width : height,
  };

  const baseClasses = `
    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
    animate-pulse
    ${circular ? "rounded-full" : "rounded"}
    ${className}
  `;

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={baseClasses}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? "75%" : width,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={baseClasses} style={skeletonStyle} aria-hidden="true" />
  );
};

/**
 * Page Loading Component with school branding
 */
export const PageLoading: React.FC<{ text?: string }> = ({
  text = "Loading Regina Nostras Schools...",
}) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
    <div className="text-center space-y-6 max-w-md w-full mx-4">
      {/* School Logo/Icon */}
      <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      {/* Loading spinner and text */}
      <Loading text={text} size="lg" showText={true} />

      {/* Additional information */}
      <p className="text-sm text-gray-500">
        Please wait while we prepare your dashboard...
      </p>
    </div>
  </div>
);

export default Loading;
