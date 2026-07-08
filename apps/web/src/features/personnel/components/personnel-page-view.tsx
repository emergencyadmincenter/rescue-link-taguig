"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  FiSearch, FiBell, FiChevronDown, FiMoreHorizontal,
  FiMessageSquare
} from "react-icons/fi";
import { 
  HiOutlineViewGrid, 
  HiOutlineUserGroup, 
  HiOutlineLocationMarker, 
  HiOutlineUser
} from "react-icons/hi";
import { BiFilterAlt } from "react-icons/bi";
import { MdCheckCircle } from "react-icons/md";
import AddPersonnelForm from "./add-personnel-form";
import EditPersonnelForm from "./edit-personnel-form";
import ConfirmationDialog from "./confirmation-dialog";

type PersonnelStatus = "verified" | "unverified" | "deactivated";

interface Personnel {
  id: string;
  name: string;
  email: string;
  initials: string;
  status: PersonnelStatus;
}

const MOCK_PERSONNEL: Personnel[] = [
  { id: "1", name: "Mark Dennis Concha", email: "markdennisconcha@resculink.com", initials: "MC", status: "verified" },
  { id: "2", name: "Liam Patel", email: "liampatel@resculink.com", initials: "LP", status: "unverified" },
  { id: "3", name: "Ava Thompson", email: "avathompson@resculink.com", initials: "AT", status: "unverified" },
];

export default function PersonnelPageView() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "deactivate" | "reactivate" | "remove"; person: Personnel } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f5f5f9] font-inter text-gray-900 flex flex-col">
      {/* ===== Top Navbar ===== */}
      <header className="bg-white border-b border-gray-100 h-[60px] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center">
          <Image 
            src="/images/logos/rlt-cc-logo.png" 
            alt="RescueLink Taguig Command Center" 
            width={160} 
            height={45} 
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 shrink-0" />
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <FiBell className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ===== Sidebar ===== */}
        <aside className="w-[190px] bg-white border-r border-gray-100 flex flex-col pt-4 shrink-0">
          {/* Collapse button */}
          <div className="flex justify-end px-4 mb-3">
            <button className="text-gray-400 hover:text-gray-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 18L5 12L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <nav className="flex flex-col mt-1">
            <SidebarItem icon={<HiOutlineViewGrid className="w-[18px] h-[18px]" />} label="Dashboard" />
            <SidebarItem icon={<HiOutlineUserGroup className="w-[18px] h-[18px]" />} label="Personnel" active />
            <SidebarItem icon={<HiOutlineLocationMarker className="w-[18px] h-[18px]" />} label="Barangays" />
            <SidebarItem icon={<HiOutlineUser className="w-[18px] h-[18px]" />} label="Coordinators" />
            <SidebarItem icon={<FiMessageSquare className="w-[18px] h-[18px]" />} label="Messages" />
          </nav>
        </aside>

        {/* ===== Main Content Area ===== */}
        <main className="flex-1 p-7 overflow-y-auto">
          <div className="bg-white rounded-xl w-full min-h-[calc(100vh-60px-56px)] px-10 py-9">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight inline-block">
                Personnel Management
              </h1>
              <div className="w-[70px] h-[3px] bg-[#e11d48] rounded-full mt-1.5" />
            </div>

            {/* Search Row */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  className="w-full pl-5 pr-10 py-2.5 border border-gray-200 rounded-full text-[13px] focus:outline-none focus:border-gray-300 text-gray-700 placeholder:text-gray-400"
                />
                <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[15px] h-[15px]" />
              </div>
              <button className="text-gray-500 hover:text-gray-700 transition-colors shrink-0">
                <BiFilterAlt className="w-[20px] h-[20px]" />
              </button>
              <button 
                onClick={() => setShowAddForm(true)}
                className="w-7 h-7 rounded-full bg-[#e11d48] hover:bg-[#be123c] text-white flex items-center justify-center transition-colors shrink-0 text-[18px] leading-none font-light"
              >
                +
              </button>
            </div>

            {/* Section Header */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[15px] font-bold text-gray-900">Coordinators</h2>
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
                  onMenuToggle={() => setOpenMenuId(openMenuId === person.id ? null : person.id)}
                  onCloseMenu={() => setOpenMenuId(null)}
                  onEdit={() => { setEditingPerson(person); setOpenMenuId(null); }}
                  onDeactivate={() => { setConfirmAction({ type: "deactivate", person }); setOpenMenuId(null); }}
                  onReactivate={() => { setConfirmAction({ type: "reactivate", person }); setOpenMenuId(null); }}
                  onResendActivation={() => { setOpenMenuId(null); }}
                  onRemove={() => { setConfirmAction({ type: "remove", person }); setOpenMenuId(null); }}
                />
              ))}
            </div>
          </div>
        </main>
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
      {confirmAction && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <ConfirmationDialog
            type={confirmAction.type}
            onCancel={() => setConfirmAction(null)}
            onConfirm={() => setConfirmAction(null)}
          />
        </div>
      )}
    </div>
  );
}

/* ---- Sidebar Item ---- */
function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-l-[3px] transition-colors ${
      active 
        ? 'border-[#e11d48] bg-red-50/80 text-[#e11d48] font-semibold' 
        : 'border-transparent text-gray-500 hover:bg-gray-50'
    }`}>
      <span className={active ? "text-[#e11d48]" : "text-gray-400"}>{icon}</span>
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

/* ---- Personnel List Item ---- */
interface PersonnelItemProps {
  person: Personnel;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onResendActivation: () => void;
  onRemove: () => void;
}

function PersonnelItem({ person, isMenuOpen, onMenuToggle, onCloseMenu, onEdit, onDeactivate, onReactivate, onResendActivation, onRemove }: PersonnelItemProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseMenu();
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen, onCloseMenu]);

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {/* Placeholder avatar circle */}
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-[13px]">{person.name}</span>
            {person.status === "verified" && (
              <span className="flex items-center gap-0.5">
                <span className="text-[11px] text-[#e11d48] font-medium italic">Verified</span>
                <MdCheckCircle className="text-[#16a34a] w-[13px] h-[13px]" />
              </span>
            )}
          </div>
          <span className="text-[12px] text-gray-400 mt-0.5">{person.email}</span>
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
            {person.status === "verified" ? (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton label="Deactivate" onClick={onDeactivate} />
                <MenuButton label="Remove" onClick={onRemove} color="text-[#e11d48]" />
              </>
            ) : person.status === "deactivated" ? (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton label="Reactivate" onClick={onReactivate} color="text-[#16a34a]" />
                <MenuButton label="Remove" onClick={onRemove} color="text-[#e11d48]" />
              </>
            ) : (
              <>
                <MenuButton label="Edit" onClick={onEdit} />
                <MenuButton label="Resend Activation" onClick={onResendActivation} />
                <MenuButton label="Deactivate" onClick={onDeactivate} />
                <MenuButton label="Remove" onClick={onRemove} color="text-[#e11d48]" />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Context Menu Button ---- */
function MenuButton({ label, onClick, color = "text-gray-700" }: { label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-1.5 text-[12px] hover:bg-gray-50 transition-colors ${color}`}
    >
      {label}
    </button>
  );
}
