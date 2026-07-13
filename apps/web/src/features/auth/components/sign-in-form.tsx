"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInFormData } from "shared-schemas/auth";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { signIn } from "@/features/auth/api/auth.api";

interface FeedbackMessage {
  type: "success" | "error";
  text: string;
}

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setFeedback(null);

    try {
      const response = await signIn(data);

      setFeedback({
        type: "success",
        text: "Sign-in successful! Redirecting...",
      });

      router.push("/personnel");
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <form
      id="sign-in-form"
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-5"
      noValidate
    >
      {/* Feedback Message */}
      {feedback && (
        <div
          id="sign-in-feedback"
          className={`flex items-center gap-2 px-4 py-3 rounded-lg body-small font-medium transition-all duration-300 animate-fade-in ${
            feedback.type === "success"
              ? "bg-green-50 text-success border border-green-200"
              : "bg-red-50 text-danger border border-red-200"
          }`}
        >
          <span className="shrink-0">
            {feedback.type === "success" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </span>
          {feedback.text}
        </div>
      )}

      {/* Email Field */}
      <div>
        <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
            <FiMail className="w-[16px] h-[16px]" />
          </span>
          <input
            id="sign-in-email"
            type="email"
            {...register("email")}
            placeholder="Email address"
            autoComplete="email"
            className={`w-full pl-7 pr-0 py-2.5 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b-[1.5px] focus:ring-0 outline-none bg-transparent transition-colors ${
              errors.email
                ? "border-danger focus:border-danger"
                : "border-gray-300 focus:border-gray-900"
            }`}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 body-xsmall text-danger font-medium animate-fade-in">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
            <FiLock className="w-[16px] h-[16px]" />
          </span>
          <input
            id="sign-in-password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Password"
            autoComplete="current-password"
            className={`w-full pl-7 pr-10 py-2.5 body-small text-gray-900 placeholder:text-gray-400 border-0 border-b-[1.5px] focus:ring-0 outline-none bg-transparent transition-colors ${
              errors.password
                ? "border-danger focus:border-danger"
                : "border-gray-300 focus:border-gray-900"
            }`}
          />
          <button
            id="toggle-password-visibility"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <FiEyeOff className="w-[16px] h-[16px]" />
            ) : (
              <FiEye className="w-[16px] h-[16px]" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 body-xsmall text-danger font-medium animate-fade-in">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          id="sign-in-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 body-small font-semibold text-primary-foreground bg-primary hover:bg-primary-hover active:bg-primary-hover/90 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );
}
