"use client";

import Link from "next/link";
import Image from "next/image";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full flex flex-col items-center text-center space-y-6">
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-4">
          <Image
            src="/images/illustrations/404-error.svg"
            alt="Page Not Found Illustration"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-outfit text-nowrap">
          Page Not Found
        </h1>

        <p className="text-gray-500 text-lg mx-auto">
          The page you are looking for may have been moved, expired, or no
          longer exists.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <FiArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <FiHome className="w-5 h-5" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
