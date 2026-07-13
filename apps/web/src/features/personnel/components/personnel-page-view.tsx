"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiSearch,
  FiBell,
  FiChevronDown,
  FiMoreHorizontal,
  FiMessageSquare,
  FiShield,
} from "react-icons/fi";
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineLocationMarker,
  HiOutlineUser,
} from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";
import { MdCheckCircle } from "react-icons/md";
import AddPersonnelForm from "./add-personnel-form";
import EditPersonnelForm from "./edit-personnel-form";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

type PersonnelStatus = "verified" | "unverified" | "deactivated";

interface Personnel {
  id: string;
  name: string;
  email: string;
  initials: string;
  status: PersonnelStatus;
}

const MOCK_PERSONNEL: Personnel[] = [
  {
    id: "1",
    name: "Mark Dennis Concha",
    email: "markdennisconcha@resculink.com",
    initials: "MC",
    status: "verified",
  },
  {
    id: "2",
    name: "Liam Patel",
    email: "liampatel@resculink.com",
    initials: "LP",
    status: "unverified",
  },
  {
    id: "3",
    name: "Ava Thompson",
    email: "avathompson@resculink.com",
    initials: "AT",
    status: "unverified",
  },
];

export default function PersonnelPageView() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "reactivate" | "remove";
    person: Personnel;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonnelStatus | "">("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { groups, isLoading, error } = usePersonnel({
    search: debouncedSearchQuery,
    status: statusFilter,
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("");
  };

  const toggleRoleExpand = (roleKey: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleKey]: prev[roleKey] !== undefined ? !prev[roleKey] : false,
    }));
  };

  return (
    <>
      <div className="bg-white rounded-xl w-full min-h-[calc(100vh-60px-56px)] px-10 py-9">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div className="w-max">
            <h1 className="display-small text-gray-900 inline-block">
              Personnel Management
            </h1>
            <div className="divider-primary-half" />
          </div>

          <Link
            href="/personnel/permissions"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 shadow-sm"
          >
            <FiShield className="w-4 h-4 text-gray-500" />
            Manage Permissions
          </Link>
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search name or email..."
              className="w-full pl-5 pr-10 py-2.5 border border-gray-200 rounded-full body-small focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
            />
            <FiSearch className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 w-[15px] h-[15px]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
          <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200 shrink-0 p-2 rounded-full hover:bg-gray-50">
            <BiFilterAlt className="w-[20px] h-[20px]" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition-all duration-200 shrink-0 text-[18px] leading-none font-light shadow-sm"
          >
            +
          </button>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="body-medium font-bold text-gray-900">Coordinators</h2>
          <FiChevronDown className="text-gray-400 w-4 h-4" />
        </div>

        <div className="border-t border-gray-100" />

        {/* Personnel List */}
        <div className="flex flex-col">
          {MOCK_PERSONNEL.map((person) => (
            <PersonnelItem
              key={person.id}
              person={person}
              isMenuOpen={openMenuId === person.id}
              onMenuToggle={() =>
                setOpenMenuId(openMenuId === person.id ? null : person.id)
              }
              onCloseMenu={() => setOpenMenuId(null)}
              onEdit={() => {
                setEditingPerson(person);
                setOpenMenuId(null);
              }}
              onDeactivate={() => {
                setConfirmAction({ type: "deactivate", person });
                setOpenMenuId(null);
              }}
              onReactivate={() => {
                setConfirmAction({ type: "reactivate", person });
                setOpenMenuId(null);
              }}
              onResendActivation={() => {
                setOpenMenuId(null);
              }}
              onRemove={() => {
                setConfirmAction({ type: "remove", person });
                setOpenMenuId(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* ===== Add Personnel Dialog ===== */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <AddPersonnelForm onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* ===== Edit Personnel Dialog ===== */}
      {editingPerson && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <EditPersonnelForm
            initialName={editingPerson.name}
            initialEmail={editingPerson.email}
            initialRole="Coordinator"
            onCancel={() => setEditingPerson(null)}
          />
        </div>
      )}

      {/* ===== Confirmation Dialog ===== */}
      <ConfirmationDialog
        isOpen={!!confirmAction}
        title={
          confirmAction?.type === "deactivate"
            ? "Deactivate Personnel Account"
            : confirmAction?.type === "reactivate"
              ? "Reactivate Personnel Account"
              : "Remove Personnel Account"
        }
        message={
          confirmAction?.type === "deactivate"
            ? "Are you sure you want to deactivate this personnel account? The personnel will no longer be able to access the system until the account is reactivated."
            : confirmAction?.type === "reactivate"
              ? "Are you sure you want to reactivate this personnel account? The personnel will regain access to the system using their existing credentials."
              : "Are you sure you want to remove this personnel account? The account will be removed from the active personnel list and can no longer be reactivated."
        }
        confirmLabel={
          confirmAction?.type === "deactivate"
            ? "Deactivate"
            : confirmAction?.type === "reactivate"
              ? "Reactivate"
              : "Remove"
        }
        isDestructive={confirmAction?.type !== "reactivate"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
      />
    </>
  );
}

/* ---- Personnel List Item ---- */
interface PersonnelItemProps {
  person: ApiPersonnelItem;
  isMenuOpen: boolean;
  isSelected: boolean;
  onClick: () => void;
  onMenuToggle: () => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onResendActivation: () => void;
  onRemove: () => void;
}

function PersonnelItem({
  person,
  isMenuOpen,
  onMenuToggle,
  onCloseMenu,
  onEdit,
  onDeactivate,
  onReactivate,
  onResendActivation,
  onRemove,
}: PersonnelItemProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseMenu();
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen, onCloseMenu]);

  return (
    <div
      className={`flex items-center justify-between py-3.5 px-4 -mx-4 rounded-lg cursor-pointer transition-colors group ${
        isSelected
          ? "bg-primary-subtle/50"
          : "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar circle with initials */}
        <div className="w-9 h-9 rounded-full bg-primary-subtle shrink-0 flex items-center justify-center text-primary font-medium body-small">
          {(() => {
            const parts = person.name.trim().split(" ");
            if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
            return (
              parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
            ).toUpperCase();
          })()}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 body-small">
              {person.name}
            </span>
            {person.status === "verified" && (
              <span className="flex items-center gap-0.5">
                <span className="body-xsmall text-primary font-medium italic">
                  Verified
                </span>
                <MdCheckCircle className="text-success w-[13px] h-[13px]" />
              </span>
            )}
          </div>
          <span className="body-xsmall text-gray-400 mt-0.5">
            {person.email}
          </span>
        </div>
      </div>

      {/* Three dots menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={onMenuToggle}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <FiMoreHorizontal className="w-[18px] h-[18px]" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 w-[150px] z-20">
            {person.status === "active" ? (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton label="Deactivate" onClick={onDeactivate} />
                <MenuButton
                  label="Remove"
                  onClick={onRemove}
                  color="text-danger"
                />
              </>
            ) : person.status === "inactive" ? (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton
                  label="Reactivate"
                  onClick={onReactivate}
                  color="text-success"
                />
                <MenuButton
                  label="Remove"
                  onClick={onRemove}
                  color="text-danger"
                />
              </>
            ) : (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton
                  label="Resend Activation"
                  onClick={onResendActivation}
                />
                <MenuButton label="Deactivate" onClick={onDeactivate} />
                <MenuButton
                  label="Remove"
                  onClick={onRemove}
                  color="text-danger"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Context Menu Button ---- */
function MenuButton({
  label,
  onClick,
  color = "text-gray-700",
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-1.5 body-xsmall hover:bg-gray-50 transition-colors ${color}`}
    >
      {label}
    </button>
  );
}
