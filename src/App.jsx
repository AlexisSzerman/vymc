import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import firebaseConfig from "./utils/firebaseConfig";
import { authorizedEmails } from "./utils/authorizedEmails";

import LoginPage from "./pages/LoginPage";
import Participants from "./pages/ParticipantsPage";
import Assignments from "./pages/AssignmentsPage";
import HistoryView from "./pages/HistoryViewPage";
import PublicView from "./pages/PublicViewPage";
import RemindersPage from "./pages/RemindersPage";
import ReplacementsPage from "./pages/ReplacementsPage";

import MessageBox from "./components/MessageBox";
import ConfirmDialog from "./components/ConfirmDialog";

const App = () => {
  const [db, setDb] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState("public");

  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    message: "",
    resolve: null,
  });

  // Inicializa Firebase y escucha cambios de auth
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    setDb(firestore);

    onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
  }, []);

  // Redirige al login si se intenta acceder a sección privada sin login
  useEffect(() => {
    if (!authUser && currentPage !== "public" && currentPage !== "login") {
      setCurrentPage("login");
    }
  }, [authUser, currentPage]);

  // Mensajes
  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => {
      setShowMessageBox(false);
    }, 3000);
  };

  const closeMessageBox = () => {
    setMessage("");
    setShowMessageBox(false);
  };

  // Confirmación
  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfirmDialog({ visible: true, message, resolve });
    });
  };

  const handleConfirm = () => {
    if (confirmDialog.resolve) confirmDialog.resolve(true);
    setConfirmDialog({ ...confirmDialog, visible: false });
  };

  const handleCancel = () => {
    if (confirmDialog.resolve) confirmDialog.resolve(false);
    setConfirmDialog({ ...confirmDialog, visible: false });
  };

  const isAuthorized = authUser && authorizedEmails.includes(authUser.email);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Verificando sesión...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter text-gray-800 p-4 sm:p-6 lg:p-8 rounded-lg shadow-inner">
      {showMessageBox && (
        <MessageBox message={message} onClose={closeMessageBox} />
      )}
      {confirmDialog.visible && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-indigo-700 dark:text-indigo-300 mb-8 sm:mb-12">
        Gestor de Reunión Vida y Ministerio Cristiano
      </h1>

      {authUser && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          Sesión iniciada como:{" "}
          <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">
            {authUser.email}
          </span>
        </p>
      )}

      <nav className="flex justify-center gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setCurrentPage("public")}
          className={navButtonClass(currentPage === "public")}
        >
          Vista Pública
        </button>
        {isAuthorized && (
          <>
            <button
              onClick={() => setCurrentPage("participants")}
              className={navButtonClass(currentPage === "participants")}
            >
              Participantes
            </button>
            <button
              onClick={() => setCurrentPage("assignments")}
              className={navButtonClass(currentPage === "assignments")}
            >
              Asignaciones
            </button>
            <button
              onClick={() => setCurrentPage("history")}
              className={navButtonClass(currentPage === "history")}
            >
              Historial
            </button>
            <button
              onClick={() => setCurrentPage("reminders")}
              className={navButtonClass(currentPage === "reminders")}
            >
              Recordatorios
            </button>
            <button
              onClick={() => setCurrentPage("replacements")}
              className={navButtonClass(currentPage === "replacements")}
            >
              Reemplazos
            </button>
          </>
        )}
      </nav>

      <main className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 border border-blue-100 dark:border-blue-700">
        {!authUser && currentPage !== "public" && (
          <LoginPage
            onLoginSuccess={(user) => {
              setAuthUser(user);
              setCurrentPage("participants");
            }}
          />
        )}

        {currentPage === "public" && db && (
          <PublicView
            db={db}
            showMessage={showMessage}
            setCurrentPage={setCurrentPage}
          />
        )}

        {authUser && !isAuthorized && currentPage !== "public" && (
          <p className="text-center text-red-600 dark:text-red-300 font-semibold">
            Usuario no está autorizado para acceder a esta sección.
            <br />
            Para pedir autorización, enviar mail a{" "}
            <strong>alexszer1986@gmail.com</strong>.
          </p>
        )}

        {authUser && isAuthorized && currentPage === "participants" && db && (
          <Participants
            db={db}
            userId={authUser.uid}
            showMessage={showMessage}
          />
        )}
        {authUser && isAuthorized && currentPage === "assignments" && db && (
          <Assignments
            db={db}
            userId={authUser.uid}
            showMessage={showMessage}
          />
        )}
        {authUser && isAuthorized && currentPage === "history" && db && (
          <HistoryView db={db} showMessage={showMessage} />
        )}
        {authUser && isAuthorized && currentPage === "reminders" && db && (
          <RemindersPage
            db={db}
            userId={authUser.uid}
            showMessage={showMessage}
          />
        )}
        {authUser && isAuthorized && currentPage === "replacements" && db && (
          <ReplacementsPage
            db={db}
            showMessage={showMessage}
            showConfirm={showConfirm}
          />
        )}
      </main>
    </div>
  );
};

const navButtonClass = (isActive) => {
  return `px-5 py-2 rounded-full font-medium transition transform hover:scale-105 ${
    isActive
      ? "bg-indigo-600 text-white shadow-lg"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  }`;
};

export default App;
