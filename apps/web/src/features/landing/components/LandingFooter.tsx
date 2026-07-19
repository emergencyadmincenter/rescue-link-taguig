import React from "react";
import Image from "next/image";
import { FiTwitter, FiFacebook, FiInstagram } from "react-icons/fi";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-20 border-t border-gray-800">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-5 xl:col-span-6 pr-0 lg:pr-12">
            <div className="mb-8">
              <div className="w-max bg-[#efefef] rounded-full px-3">
                <div className="relative w-40 md:w-48 h-12 flex-shrink-0">
                  <Image
                    src="/images/logos/rlt-main-logo.png"
                    alt="Rescue Link Logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed">
              A modern, reliable, and secure platform for emergency response
              coordination. We connect residents with responders when every
              second counts.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/20"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/20"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/20"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 xl:col-span-3">
            <h4 className="text-white font-semibold text-lg mb-6">
              Quick Links
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/sign-in"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Sign In
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 xl:col-span-3">
            <h4 className="text-white font-semibold text-lg mb-6">Legal</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-base text-gray-500">
          <p>© {currentYear} Rescue Link. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Emergency systems are online
          </p>
        </div>
      </div>
    </footer>
  );
}
