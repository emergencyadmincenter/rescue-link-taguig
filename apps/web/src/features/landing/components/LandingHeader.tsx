"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`bg-white fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-md shadow-sm py-3 border-b border-gray-200"
          : "backdrop-blur-md border-b border-gray-200/50 py-5"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="block group">
            <div className="relative w-36 md:w-44 h-10 transition-transform group-hover:scale-[1.02]">
              <Image
                src="/images/logos/rlt-main-logo.png"
                alt="Rescue Link Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="body-small font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="body-small font-medium text-gray-600 hover:text-primary transition-colors"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="body-small font-medium text-gray-600 hover:text-primary transition-colors"
            >
              FAQ
            </button>
            <Link
              href="/sign-in"
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full body-small font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 md:hidden animate-in slide-in-from-top-2">
          <div className="flex flex-col p-4 space-y-4">
            <button
              onClick={() => scrollToSection("features")}
              className="text-left font-medium text-gray-700 py-2 border-b border-gray-50"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-left font-medium text-gray-700 py-2 border-b border-gray-50"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-left font-medium text-gray-700 py-2 border-b border-gray-50"
            >
              FAQ
            </button>
            <Link
              href="/sign-in"
              className="w-full text-center px-5 py-3 bg-gray-900 text-white rounded-lg font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
