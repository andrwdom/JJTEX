"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OptimizedImage from './optimized-image'
import FallbackCarousel from './fallback-carousel'
import { useCarousel } from '@/hooks/useCarousel'
import { CarouselImage, BannerCarouselProps } from '@/types/carousel'

export default function BannerCarousel({
  images = [],
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  className = ''
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  
  const carouselRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<number>(0)
  const touchEndRef = useRef<number>(0)

  // Use custom hook for data fetching
  const { images: fetchedImages, loading, error } = useCarousel()
  
  // Use fetched images if available, otherwise fallback to props
  const carouselImages = fetchedImages.length > 0 ? fetchedImages : images

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || carouselImages.length <= 1) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, carouselImages.length, interval])

  // Pause auto-play on hover
  const handleMouseEnter = useCallback(() => {
    if (autoPlay) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay])

  const handleMouseLeave = useCallback(() => {
    if (autoPlay) {
      setIsPlaying(true)
    }
  }, [autoPlay])

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }, [carouselImages.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
  }, [carouselImages.length])

  // Touch/swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return

    const distance = touchStartRef.current - touchEndRef.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }

    touchStartRef.current = 0
    touchEndRef.current = 0
  }, [goToNext, goToPrevious])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  // Loading state
  if (loading) {
    return (
      <div className={`w-full aspect-[16/9] bg-gray-100 animate-pulse rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading carousel...</div>
        </div>
      </div>
    )
  }

  // Error state - only show for unexpected errors, not 401/404
  if (error && carouselImages.length === 0) {
    return (
      <div className={`w-full aspect-[16/9] bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <p>Unable to load carousel images</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // No images state - show fallback carousel
  if (carouselImages.length === 0) {
    return <FallbackCarousel className={className} />
  }

  return (
    <section className={`w-full ${className}`}>
      <div
        ref={carouselRef}
        className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl shadow-lg"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Carousel Images */}
        <div className="relative w-full h-full">
          {carouselImages.map((image, index) => (
            <div
              key={image.id || index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <OptimizedImage
                src={image.url}
                alt={image.alt || `Carousel image ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              
              {/* Image overlay with title, description, and button */}
              {(image.title || image.description || image.buttonText) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
                    <div className="max-w-2xl">
                      {image.title && (
                        <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4 text-white leading-tight tracking-tight">
                          {image.title}
                        </h3>
                      )}
                      {image.description && (
                        <p className="text-sm md:text-base lg:text-lg mb-4 md:mb-6 text-white/95 leading-relaxed font-light max-w-xl">
                          {image.description}
                        </p>
                      )}
                      {image.buttonText && image.link && (
                        <a
                          href={image.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle internal navigation if needed
                            if (image.link?.startsWith('/')) {
                              e.preventDefault();
                              window.location.href = image.link;
                            }
                          }}
                          className="inline-flex items-center justify-center px-6 md:px-8 py-2.5 md:py-3 bg-[#E91E63] hover:bg-[#C2185B] text-white font-semibold rounded-full transition-all duration-300 ease-in-out shadow-[0_4px_20px_rgba(233,30,99,0.4)] hover:shadow-[0_6px_30px_rgba(233,30,99,0.6)] hover:-translate-y-0.5 active:scale-95 text-sm md:text-base"
                        >
                          {image.buttonText}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && carouselImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-lg"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-lg"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {showDots && carouselImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white scale-125 shadow-lg'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}



        {/* Clickable overlay for image links - only if no button text (button handles click) */}
        {carouselImages[currentIndex]?.link && !carouselImages[currentIndex]?.buttonText && (
          <a
            href={carouselImages[currentIndex].link}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={`Navigate to ${carouselImages[currentIndex].title || 'carousel link'}`}
            onClick={(e) => {
              // Handle internal navigation if needed
              if (carouselImages[currentIndex].link?.startsWith('/')) {
                e.preventDefault();
                window.location.href = carouselImages[currentIndex].link;
              }
            }}
          />
        )}
      </div>
    </section>
  )
} 