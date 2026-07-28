"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  FiUploadCloud,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiArrowLeft,
} from "react-icons/fi";
import { useAuth } from "@/providers/AuthProvider";
import { profileApi, UserProfile, UpdateProfileData } from "../api/profile.api";

export function ProfilePageView() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
        setName(data.name || "");
        setPhoneNumber(data.phone_number || "");
        setAddress(data.address || "");
      } catch (error) {
        console.error("Failed to load profile", error);
        toast.error("Failed to load profile details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const updateData: UpdateProfileData = {
        name,
        phone_number: phoneNumber,
        address,
      };

      const updatedProfile = await profileApi.updateProfile(updateData);
      setProfile(updatedProfile);

      // Sync global user state seamlessly
      updateUser({ name: updatedProfile.name });

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported file format. Please upload JPG, PNG, or WEBP.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const data = await profileApi.uploadAvatar(file);
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: data.avatar_url } : null,
      );

      // Update the global state so UserProfileMenu avatar changes immediately
      updateUser({ avatar_url: data.avatar_url });

      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500 body-small">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-danger body-small">Could not load profile.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto pb-10">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to previous page
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="title-large font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="body-medium text-gray-500">
            Manage your personal information and account settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Read-only Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 relative">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                      <FiUser className="w-12 h-12" />
                    </div>
                  )}

                  {/* Upload Overlay */}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <FiUploadCloud className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">
                      {isUploadingAvatar ? "Uploading..." : "Change"}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="avatar-upload"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                </div>
              </div>

              <h2 className="title-small font-bold text-gray-900">
                {profile.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                {profile.user_roles?.map((r, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  >
                    {r.role.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 w-full">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-left">
                Account Details
              </h3>

              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                      <FiMail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Email</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-[180px] text-right" title={profile.email}>
                    {profile.email}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                      <FiCalendar className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Joined</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 text-right">
                    {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-100">
              Personal Information
            </h3>

            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your first, middle (if applicable), and last name.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                  placeholder="+63 900 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address / Assigned Location
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-none"
                  placeholder="Enter your address..."
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
