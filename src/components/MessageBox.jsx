const MessageBox = ({ message, onClose }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-sm border border-gray-700 transition-all duration-300 transform scale-100">
      <h3 className="text-lg font-semibold text-white mb-3">Mensaje</h3>
      <p className="text-gray-300 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition duration-200 ease-in-out"
      >
        Cerrar
      </button>
    </div>
  </div>
);

export default MessageBox;
