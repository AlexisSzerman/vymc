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
import ExportAssignmentsPage from "./pages/ExportAssignmentsPage";
import MessageBox from "./components/MessageBox";
import ConfirmDialog from "./components/ConfirmDialog";
import Navigation from "./components/Navigation";
import Header from "./components/Header"; 
import DashboardPage from "./pages/DashboardPage";

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

  useEffect(() => {
    if (!authUser && currentPage !== "public" && currentPage !== "login") {
      setCurrentPage("login");
    }
  }, [authUser, currentPage]);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-inter text-gray-800 dark:text-gray-100">
      <Header
        authUser={authUser}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        {authUser && (
          <Navigation
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
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


          {!authUser && currentPage !== "public" && (
            <LoginPage
              onLoginSuccess={(user) => {
                setAuthUser(user);
                setCurrentPage("public");
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
              Usuario no autorizado para acceder a esta sección.
              <br />
              Para pedir autorización, enviar mail a{" "}
              <strong>alexszer1986@gmail.com</strong>.
            </p>
          )}
           {currentPage === "dashboard" && (
              <DashboardPage db={db} showMessage={showMessage} authUser={authUser} />
            )}
            {currentPage === "export" && (
              <ExportAssignmentsPage db={db} showMessage={showMessage} />
            )}
          {authUser && isAuthorized && currentPage === "participants" && db && (
            <Participants db={db} userId={authUser.uid} showMessage={showMessage} />
          )}
          {authUser && isAuthorized && currentPage === "assignments" && db && (
            <Assignments db={db} userId={authUser.uid} showMessage={showMessage} />
          )}
          {authUser && isAuthorized && currentPage === "history" && db && (
            <HistoryView db={db} showMessage={showMessage} />
          )}
          {authUser && isAuthorized && currentPage === "reminders" && db && (
            <RemindersPage db={db} userId={authUser.uid} showMessage={showMessage} />
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
    </div>
  );
};

export default App;
