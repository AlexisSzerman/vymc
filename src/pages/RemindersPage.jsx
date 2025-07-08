import ReminderManager from '../components/ReminderManager';
import { Bell } from "lucide-react";

const RemindersPage = ({ db, showMessage }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
        <Bell className="w-6 h-6" /> Gestión de Recordatorios
      </h2>
      <ReminderManager db={db} showMessage={showMessage} />
    </div>
  );
};

export default RemindersPage;
