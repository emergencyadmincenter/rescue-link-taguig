"use client";

interface ConfirmationDialogProps {
  type: "deactivate" | "reactivate" | "remove";
  onCancel: () => void;
  onConfirm: () => void;
}

const CONFIG = {
  deactivate: {
    title: "Deactivate Personnel Account",
    message: "Are you sure you want to deactivate this personnel account?",
    bold: "The personnel will no longer be able to access the system until the account is reactivated.",
    note: "Historical records will remain unchanged.",
    buttonLabel: "Deactivate",
    buttonColor: "bg-[#e11d48] hover:bg-[#be123c]",
  },
  reactivate: {
    title: "Reactivate Personnel Account",
    message: "Are you sure you want to reactivate this personnel account?",
    bold: "The personnel will regain access to the system using their existing credentials.",
    note: "",
    buttonLabel: "Reactivate",
    buttonColor: "bg-[#16a34a] hover:bg-[#15803d]",
  },
  remove: {
    title: "Remove Personnel Account",
    message: "Are you sure you want to remove this personnel account?",
    bold: "The account will be removed from the active personnel list and can no longer be reactivated.",
    note: "Historical records associated with this personnel will be preserved.",
    buttonLabel: "Remove",
    buttonColor: "bg-[#e11d48] hover:bg-[#be123c]",
  },
};

export default function ConfirmationDialog({ type, onCancel, onConfirm }: ConfirmationDialogProps) {
  const config = CONFIG[type];

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-[420px]">
      <div className="px-6 pt-6 pb-5">
        <h2 className="text-[15px] font-bold text-[#e11d48] text-center mb-4">{config.title}</h2>

        <p className="text-[13px] text-gray-600 text-center leading-relaxed mb-5">
          {config.message}{" "}
          <span className="font-bold text-gray-900">{config.bold}</span>
          {config.note && <> {config.note}</>}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-[13px] font-semibold text-white rounded-md transition-colors ${config.buttonColor}`}
          >
            {config.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
