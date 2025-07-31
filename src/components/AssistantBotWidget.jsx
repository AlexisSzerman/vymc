import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Transition } from "@headlessui/react";
import { formatAssignmentType } from "../utils/helpers"; // Asumiendo que utils.js está en el directorio padre

function normalizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatDateAr(str) {
  if (!str || !str.includes("-")) return str;
  const [y, m, d] = str.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export default function AssistantBotWidget({ db, appId, userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("proximas");
  const [assignments, setAssignments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [reminders, setReminders] = useState([]);

  const [nameInput, setNameInput] = useState("");
  const [selectedReminder, setSelectedReminder] = useState("");

  const panelRef = useRef(null);
  const buttonRef = useRef(null); 
  const [isNearBottom, setIsNearBottom] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    const threshold = 100; // píxeles antes del final
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.body.offsetHeight;

    setIsNearBottom(scrollPosition + threshold >= pageHeight);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aSnap = await getDocs(
          collection(db, `artifacts/${appId}/public/data/assignments`)
        );
        const pSnap = await getDocs(
          collection(db, `artifacts/${appId}/public/data/participants`)
        );
        const rSnap = await getDocs(
          collection(db, `artifacts/${appId}/public/data/public_reminders`)
        );

        const assignmentsData = aSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            published: Object.prototype.hasOwnProperty.call(data, "published")
              ? data.published
              : true,
          };
        });

        setAssignments(assignmentsData);
        setParticipants(
          pSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        // Para recordatorios, aseguramos que 'id' sea el ID del documento y 'date' sea el campo
        setReminders(rSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error al cargar datos", err);
      }
    };
    fetchData();
  }, [db, appId, userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Cerrar si se hace clic fuera del panel Y no en el botón
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filterParticipantsByPartialName = (input) => {
    const normalizedInput = normalizeText(input);
    return participants.filter((p) =>
      normalizeText(p.name).includes(normalizedInput)
    );
  };

  const filterAssignments = (participantName, upcoming = true) => {
    if (!participantName) return [];
    return assignments.filter((a) => {
      if (!a.published) return false; // Solo publicadas
      const names = [a.participantName, a.secondParticipantName].filter(
        (n) => typeof n === "string"
      );
      const matchName = names.some(
        (n) => normalizeText(n) === normalizeText(participantName)
      );
      if (!matchName) return false;
      if (!a.date) return false;
      return upcoming ? a.date >= todayStr : a.date < todayStr;
    });
  };

  const getRemindersByType = (type) => {
    if (!type) return [];
    return reminders.filter(
      (r) => r.type?.toLowerCase() === type.toLowerCase()
    );
  };

  return (
    <>
      <button
        ref={buttonRef} // Asignar referencia al botón
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition duration-300 transform hover:scale-110
        ${isNearBottom ? "opacity-30" : "opacity-100"}`}
      aria-label="Abrir búsqueda rápida"

      >
        {/* <span className="text-3xl">🔍</span> */}
        <span className="jw-icon jw-icon-125 text-2xl leading-none"></span>
      </button>

      <Transition
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-90 translate-y-4"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100 translate-y-0"
        leaveTo="opacity-0 scale-90 translate-y-4"
      >
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 w-80 max-h-[80vh] flex flex-col border border-gray-700 bg-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-4 bg-gray-900 text-indigo-300 font-bold flex flex-col gap-3">
            <h2 className="text-xl">Búsqueda Rápida</h2>
            <div className="flex justify-between text-sm overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {" "}
              {/* Se agregó overflow-x para pantallas más pequeñas */}
              <button
                className={`flex-shrink-0 px-3 py-1 rounded-full transition duration-200 ${
                  activeTab === "proximas"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-indigo-700 text-indigo-200"
                }`}
                onClick={() => setActiveTab("proximas")}
              >
                Próximas
              </button>
              <button
                className={`flex-shrink-0 px-3 py-1 rounded-full transition duration-200 ${
                  activeTab === "pasadas"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-indigo-700 text-indigo-200"
                }`}
                onClick={() => setActiveTab("pasadas")}
              >
                Pasadas
              </button>
              <button
                className={`flex-shrink-0 px-3 py-1 rounded-full transition duration-200 ${
                  activeTab === "recordatorios"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-indigo-700 text-indigo-200"
                }`}
                onClick={() => setActiveTab("recordatorios")}
              >
                Recordatorios
              </button>
            </div>
          </div>

          <div className="p-4 text-gray-200 flex-grow overflow-y-auto custom-scrollbar">
            {" "}
            {/* Se agregó custom-scrollbar */}
            {(activeTab === "proximas" || activeTab === "pasadas") && (
              <>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Escriba un nombre o apellido"
                  className="w-full px-4 py-2 mb-4 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                  spellCheck={false}
                />

                {nameInput.trim() === "" ? (
                  <div className="text-gray-400 text-sm italic p-2 rounded-md bg-gray-700 border border-gray-600">
                    Escriba un nombre o apellido para ver las asignaciones.
                  </div>
                ) : (
                  (() => {
                    const matchedParticipants =
                      filterParticipantsByPartialName(nameInput);
                    if (matchedParticipants.length === 0) {
                      return (
                        <div className="text-red-300 text-sm italic p-2 rounded-md bg-gray-700 border border-gray-600">
                          No se encontró ningún participante con ese nombre.
                        </div>
                      );
                    }

                    return matchedParticipants.map((participant) => {
                      const filtered = filterAssignments(
                        participant.name,
                        activeTab === "proximas"
                      );
                      return (
                        <div key={participant.id} className="mb-4">
                          <p className="text-sm font-semibold text-indigo-400 mb-2 border-b border-gray-700 pb-1">
                            {participant.name}
                          </p>

                          {filtered.length === 0 ? (
                            <div className="text-gray-400 text-xs italic p-2 rounded-md bg-gray-700 border border-gray-600">
                              No hay asignaciones{" "}
                              {activeTab === "proximas"
                                ? "próximas"
                                : "pasadas"}{" "}
                              para{" "}
                              <span className="font-semibold text-indigo-300">
                                {participant.name}
                              </span>
                              .
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {[...filtered]
                                .sort((a, b) =>
                                  (a.date || a.id).localeCompare(b.date || b.id)
                                )
                                .map((a) => {
                                  const main = a.participantName || "";
                                  const helper = a.secondParticipantName || "";
                                  const isMain =
                                    normalizeText(main) ===
                                    normalizeText(participant.name);
                                  const isHelper =
                                    normalizeText(helper) ===
                                    normalizeText(participant.name);

                                  let roleInfo = "";

                                  if (isHelper && !isMain && main) {
                                    roleInfo = `como ayudante de ${main}`;
                                  } else if (
                                    isMain &&
                                    helper &&
                                    normalizeText(helper) !==
                                      normalizeText(main)
                                  ) {
                                    roleInfo = `junto a ${helper}`;
                                  }

                                  return (
                                    <li
                                      key={a.id}
                                      className="py-1 border-b border-gray-700 last:border-b-0"
                                    >
                                      <p className="text-white">
                                        <span className="font-semibold">
                                          {formatAssignmentType(a.type)}
                                        </span>
                                        <span className="text-sm text-indigo-300 ml-2">
                                          — {formatDateAr(a.date || a.id)}
                                        </span>
                                      </p>
                                      {roleInfo && (
                                        <p className="text-xs text-gray-400 italic mt-0.5">
                                          ({roleInfo})
                                        </p>
                                      )}
                                    </li>
                                  );
                                })}
                            </ul>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </>
            )}
            {activeTab === "recordatorios" && (
              <>
                <select
                  value={selectedReminder}
                  onChange={(e) => setSelectedReminder(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 mb-4"
                >
                  <option value="">Seleccionar tipo de recordatorio</option>
                  {/* Los valores actualizados coinciden con los strings capitalizados del ReminderManager */}
                  <option value="Asamblea de Circuito">
                    Asamblea de Circuito
                  </option>
                  <option value="Asamblea Regional">Asamblea Regional</option>
                  <option value="Visita del Superintendente">
                    Visita del Superintendente
                  </option>
                  <option value="Visita Especial">Visita Especial</option>
                  <option value="Conmemoración">Conmemoración</option>
                  <option value="Otros">Otros</option>{" "}
                  {/* Se agregó 'Otros' para coincidir con el valor predeterminado de ReminderManager */}
                </select>
                {selectedReminder === "" && (
                  <div className="text-gray-400 text-sm italic p-2 rounded-md bg-gray-700 border border-gray-600">
                    Elija un tipo de recordatorio para ver el mensaje.
                  </div>
                )}
                {selectedReminder !== "" &&
                  (() => {
                    const filteredReminders =
                      getRemindersByType(selectedReminder);
                    if (filteredReminders.length === 0) {
                      return (
                        <div className="text-red-300 text-sm italic p-2 rounded-md bg-gray-700 border border-gray-600">
                          No hay recordatorios de ese tipo.
                        </div>
                      );
                    }

                    return filteredReminders.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-gray-700 p-4 rounded-lg mt-2 whitespace-pre-wrap text-indigo-300 border border-gray-600 shadow-inner"
                      >
                        <p className="font-bold text-gray-200 mb-2">
                          Recordatorio:{" "}
                          <span className="capitalize">{selectedReminder}</span>
                        </p>
                        <p className="flex items-center text-sm mb-1">
                          <span className="mr-2 text-indigo-400">📅</span>{" "}
                          {formatDateAr(rec.date || rec.id)}
                        </p>
                        <p className="flex items-start text-sm">
                          <span className="mr-2 text-indigo-400">📝</span>{" "}
                          {rec.message}
                        </p>
                      </div>
                    ));
                  })()}
              </>
            )}
          </div>

          <div className="text-center text-xs text-gray-400 py-2 bg-gray-900 border-t border-gray-700">
            v0.2
          </div>
        </div>
      </Transition>
    </>
  );
}
