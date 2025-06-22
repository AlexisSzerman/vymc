
const MessageBox = ({ message, onClose }) => (
  <div
    className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-blue-200 dark:border-blue-700 transition-all duration-300 transform scale-100">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mensaje</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
      >
        Cerrar
      </button>
    </div>
  </div>
);

export default MessageBox;
