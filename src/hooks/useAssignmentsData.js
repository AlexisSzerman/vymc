//hooks/useAssignmentsData.js

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";

// __app_id es una variable global proporcionada por el entorno Canvas
const appId =  'default-app-id';

const useAssignmentsData = (db, userId) => {
  const [participants, setParticipants] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [replacements, setReplacements] = useState([]);

  useEffect(() => {
    if (!db || !userId) return;

    // Referencia a la colección de participantes
    const participantsRef = collection(
      db,
      `artifacts/${appId}/public/data/participants`
    );
    // Suscripción en tiempo real a los participantes
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipants(fetched);
    });

    // Referencia a la colección de asignaciones
    const assignmentsRef = collection(
      db,
      `artifacts/${appId}/public/data/assignments`
    );
    // Suscripción en tiempo real a las asignaciones
    const unsubscribeAssignments = onSnapshot(assignmentsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllAssignments(fetched);
    });

    // Referencia a la colección de reemplazos
    const replacementsRef = collection(
      db,
      `artifacts/${appId}/public/data/replacements`
    );
    // Suscripción en tiempo real a los reemplazos
    const unsubscribeReplacements = onSnapshot(replacementsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplacements(fetched);
    });

    // Función de limpieza para desuscribirse cuando el componente se desmonte
    return () => {
      unsubscribeParticipants();
      unsubscribeAssignments();
      unsubscribeReplacements();
    };
  }, [db, userId]); // Dependencias: db y userId para re-ejecutar si cambian

  return { participants, allAssignments, replacements };
};

export default useAssignmentsData;
