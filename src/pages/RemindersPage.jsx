import ReminderManager from '../components/ReminderManager';

const RemindersPage = ({ db, showMessage }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center">Gestión de Recordatorios</h2>
      <ReminderManager db={db} showMessage={showMessage} />
    </div>
  );
};

export default RemindersPage;
