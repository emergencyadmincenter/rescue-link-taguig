"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiLoader, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { activateAccount } from "@/features/personnel/api/personnel.api";

export default function ActivatePageView({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateAccount({ token, password });
      toast.success("Account activated successfully!");
      router.push("/sign-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
      setIsSubmitting(false); // only stop spinner on failure so we don't flash before redirect
    }
  };

  return (
    <div className="min-h-screen bg-background-subtle font-inter text-foreground flex flex-col lg:flex-row justify-center items-center gap-12 lg:gap-32 p-6 lg:p-24 relative overflow-hidden">
      {/* Decorative elements for the background */}
      <div className="hidden lg:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-subtle/50 blur-3xl mix-blend-multiply" />
      <div className="hidden lg:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-info/20 blur-3xl mix-blend-multiply" />

      {/* Left Side - Branding & Illustration */}
      <div className="flex flex-col items-center justify-center relative z-10 w-full lg:w-auto max-w-[420px]">
        {/* Mobile/Tablet Logo */}
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

        {/* Desktop Branding */}
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
            <h1 className="display-medium text-foreground">Activate Account</h1>
            <p className="body-small text-gray-500 mt-2">
              Set your password to finalize your account setup.
            </p>
            <div className="divider-primary-half mt-xs" />
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="body-small text-danger text-center">{error}</p>
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="body-small font-medium text-gray-700 block mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 body-medium text-foreground bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-4 h-4" />
                  ) : (
                    <FiEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="body-small font-medium text-gray-700 block mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 body-medium text-foreground bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 bg-primary hover:bg-primary-hover active:bg-primary text-primary-foreground body-medium font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Account"
              )}
            </button>
          </form>
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
