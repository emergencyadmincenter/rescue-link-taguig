import React from "react";
import Image from "next/image";
import { FiTwitter, FiFacebook, FiInstagram, FiYoutube } from "react-icons/fi";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-20 border-t border-gray-800">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-5 xl:col-span-6 pr-0 lg:pr-12">
            <div className="mb-8">
              <a
                href="https://www.taguig.gov.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-max bg-gray-500 rounded-lg px-3 block"
              >
                <div className="relative w-40 md:w-48 h-12 flex-shrink-0">
                  <Image
                    src="/images/logos/rlt-main-logo.png"
                    alt="RescueLink Logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </a>
            </div>
            <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed">
              Taguig City's modern, reliable, and secure platform for emergency
              response coordination.
              <br />
              <br />
              <span className="text-sm">
                Taguig City Hall, Gen. Antonio Luna St., Tuktukan
              </span>
              <br />
              <span className="text-sm">
                Taguig CDRRMO, New Lower Bicutan, Taguig
              </span>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/taguigcity"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/20"
              >
                <FiFacebook className="w-5 h-5" />
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
                  href="https://www.taguig.gov.ph/our-departments/profile/?view=city-disaster-risk-reduction-and-management-office"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Taguig CDRRMO Website
                </a>
              </li>
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
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-lg"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-base text-gray-500">
          <p>
            © {currentYear} RescueLink Taguig Command Center. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
