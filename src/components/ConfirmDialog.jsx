
import {
TriangleAlert
} from "lucide-react";

const ConfirmDialog = ({ message, onConfirm, onCancel, confirmLabel = "Confirmar" }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-5">
        <div className="flex items-start gap-2">
  <TriangleAlert className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
  <p className="text-gray-100 text-base font-medium">{message}</p>
</div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md border border-red-700 bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

