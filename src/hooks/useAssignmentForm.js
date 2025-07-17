//hooks/useAssignmentForm.js

import { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";


const useAssignmentForm = (db, userId, appId, showMessage, allAssignments, participants, showConfirm) => {
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [secondSelectedParticipantId, setSecondSelectedParticipantId] = useState("");
  const [assignmentOrder, setAssignmentOrder] = useState("");
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Resetea todos los campos del formulario
  const resetForm = () => {
    setEditingAssignment(null);
    setSelectedType("");
    setAssignmentTitle("");
    setAssignmentOrder("");
    setSelectedParticipantId("");
    setSecondSelectedParticipantId("");
  };

  // Maneja la edición de una asignación existente
  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setMeetingDate(assignment.date);
    setSelectedType(assignment.type);
    setAssignmentTitle(assignment.title);
    setAssignmentOrder(assignment.orden ?? "");
    setSelectedParticipantId(assignment.participantId || "");
    setSecondSelectedParticipantId(assignment.secondParticipantId || "");
    window.scrollTo({ top: 300, behavior: "smooth" }); // Desplaza la vista al formulario
  };

  // Maneja el guardado (creación o actualización) de una asignación
  const handleSave = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario

    // Validaciones iniciales
    if (!meetingDate) {
      return showMessage("Primero debes seleccionar una fecha de reunión.");
    }

    const isAssembly = ["asamblea-circuito", "asamblea-regional", "cancion"].includes(selectedType);
    if (!isAssembly && !selectedParticipantId) {
      return showMessage("Completa los campos requeridos.");
    }

    // Validación de asignaciones en el mismo día para evitar duplicados
    const sameDayAssignments = allAssignments.filter(
      (a) => a.date === meetingDate && a.id !== (editingAssignment?.id ?? "")
    );

    let participantAlreadyAssigned = false;
    let secondParticipantAlreadyAssigned = false;

    sameDayAssignments.forEach((a) => {
      if (
        a.participantId === selectedParticipantId ||
        a.secondParticipantId === selectedParticipantId
      ) {
        participantAlreadyAssigned = true;
      }
      if (
        selectedType === "demostracion" &&
        (a.participantId === secondSelectedParticipantId ||
          a.secondParticipantId === secondSelectedParticipantId)
      ) {
        secondParticipantAlreadyAssigned = true;
      }
    });

    // Si hay un conflicto, pide confirmación al usuario
    if (participantAlreadyAssigned || secondParticipantAlreadyAssigned) {
      const confirm = await showConfirm(
        "El participante ya tiene una asignación esta fecha. ¿Deseas continuar?",
        "Continuar"
      );
      if (!confirm) {
        return; // El usuario canceló la operación
      }
    }

    // Prepara los datos de la asignación
    const data = {
      date: meetingDate,
      type: selectedType,
      title: assignmentTitle.trim(),
      orden: parseInt(assignmentOrder, 10) || 99, // Orden por defecto si no se especifica
      participantId: selectedParticipantId || null,
      participantName:
        participants.find((p) => p.id === selectedParticipantId)?.name || null,
      published: editingAssignment?.published ?? false,
    };

    // Lógica específica para asignaciones de "demostracion"
    if (selectedType === "demostracion") {
      if (
        !secondSelectedParticipantId ||
        secondSelectedParticipantId === selectedParticipantId
      ) {
        return showMessage("Selecciona un segundo participante válido.");
      }
      data.secondParticipantId = secondSelectedParticipantId;
      data.secondParticipantName =
        participants.find((p) => p.id === secondSelectedParticipantId)?.name ||
        null;
    } else {
      // Si no es demostración, asegura que los campos de segundo participante no estén presentes
      data.secondParticipantId = null;
      data.secondParticipantName = null;
    }

    try {
      if (editingAssignment) {
        // Si estamos editando, registra los cambios en la colección de reemplazos
        const changes = [];

        // Verifica cambios en el participante titular
        if (
          editingAssignment.participantId &&
          editingAssignment.participantId !== selectedParticipantId
        ) {
          changes.push({
            role: "titular",
            oldId: editingAssignment.participantId,
            oldName: editingAssignment.participantName,
            newId: selectedParticipantId,
            newName: data.participantName,
          });
        }

        // Verifica cambios en el participante ayudante (solo para demostraciones)
        if (
          selectedType === "demostracion" &&
          editingAssignment.secondParticipantId !== secondSelectedParticipantId
        ) {
          changes.push({
            role: "ayudante",
            oldId: editingAssignment.secondParticipantId || null,
            oldName: editingAssignment.secondParticipantName || null,
            newId: secondSelectedParticipantId,
            newName: data.secondParticipantName,
          });
        }

        // Guarda los registros de reemplazo en Firestore
        for (const change of changes) {
          await addDoc(
            collection(db, `artifacts/${appId}/public/data/replacements`),
            {
              assignmentId: editingAssignment.id,
              date: meetingDate,
              type: selectedType,
              title: assignmentTitle.trim(),
              replacedRole: change.role,
              oldParticipantId: change.oldId,
              oldParticipantName: change.oldName,
              newParticipantId: change.newId,
              newParticipantName: change.newName,
              timestamp: new Date().toISOString(),
            }
          );
        }

        // Actualiza la asignación en Firestore
        await updateDoc(
          doc(db, `artifacts/${appId}/public/data/assignments`, editingAssignment.id),
          data
        );
        showMessage("Asignación actualizada.");
      } else {
        // Si es una nueva asignación, la añade a Firestore
        await addDoc(
          collection(db, `artifacts/${appId}/public/data/assignments`),
          data
        );
        showMessage("Asignación creada.");
      }
      resetForm(); // Limpia el formulario después de guardar
    } catch (error) {
      console.error("Error al guardar asignación:", error);
      showMessage(`Error: ${error.message}`);
    }
  };

  return {
    meetingDate,
    setMeetingDate,
    selectedType,
    setSelectedType,
    assignmentTitle,
    setAssignmentTitle,
    selectedParticipantId,
    setSelectedParticipantId,
    secondSelectedParticipantId,
    setSecondSelectedParticipantId,
    assignmentOrder,
    setAssignmentOrder,
    editingAssignment,
    setEditingAssignment,
    handleSave,
    resetForm,
    handleEdit,
  };
};

export default useAssignmentForm;
