//hooks/useConfirmDialog.js

import { useState } from "react";

const useConfirmDialog = () => {
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    message: "",
    resolve: null, // Función para resolver la promesa cuando se confirma/cancela
    confirmLabel: "Confirmar",
  });

  // Muestra el diálogo de confirmación y devuelve una promesa
  const showConfirm = (message, confirmLabel = "Confirmar") => {
    return new Promise((resolve) => {
      setConfirmDialog({ visible: true, message, resolve, confirmLabel });
    });
  };

  // Cierra el diálogo y resuelve la promesa
  const handleConfirmClose = (result) => {
    if (confirmDialog.resolve) {
      confirmDialog.resolve(result);
    }
    setConfirmDialog({ visible: false, message: "", resolve: null, confirmLabel: "Confirmar" });
  };

  return { confirmDialog, showConfirm, handleConfirmClose };
};

export default useConfirmDialog;
