import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import SignInForm from "@/features/auth/components/sign-in-form";

export default function SignInPageView() {
  return (
    <div className="min-h-screen bg-background-subtle font-inter text-foreground flex flex-col lg:flex-row justify-center items-center gap-12 lg:gap-32 p-6 lg:p-24 relative overflow-hidden">
      {/* Back to Home Link */}
      <Link 
        href="/"
        className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200 z-50 body-small font-medium group"
      >
        <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Return to Homepage
      </Link>

      {/* Decorative elements for the background */}
      <div className="hidden lg:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-subtle/50 blur-3xl mix-blend-multiply" />
      <div className="hidden lg:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-info/20 blur-3xl mix-blend-multiply" />

      {/* Left Side - Branding & Illustration */}
      <div className="flex flex-col items-center justify-center relative z-10 w-full lg:w-auto max-w-[420px]">
        {/* Mobile/Tablet Logo (Visible only on smaller viewports) */}
        <div className="flex lg:hidden justify-center w-full mb-4">
          <Image
            src="/images/logos/rlt-cc-logo.png"
            alt="RescueLink Taguig Command Center"
            width={200}
            height={56}
            className="object-contain"
            priority
          />
        </div>

        {/* Desktop Branding (Visible only on large viewports) */}
        <div className="hidden lg:flex flex-col items-center text-center mb-16">
          <Image
            src="/images/logos/rlt-cc-logo.png"
            alt="RescueLink Taguig Command Center"
            width={480}
            height={240}
            className="object-contain"
            priority
          />

          <p className="text-gray-500 body-medium leading-relaxed">
            Manage emergency responses, coordinate personnel, and monitor
            barangay situations efficiently in real-time.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center relative z-10 w-full lg:w-auto max-w-[400px]">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="display-medium text-foreground">Welcome back</h1>
            <p className="body-small text-gray-500 mt-2">
              Sign in to your command center account to continue
            </p>
            <div className="divider-primary-half mt-xs" />
          </div>
          {/* Form Component */}
          <SignInForm />
        </div>

        {/* Footer */}
        <p className="body-small text-gray-400 mt-8 text-center ml-2">
          &copy; {new Date().getFullYear()} RescueLink Taguig. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
