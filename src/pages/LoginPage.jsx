import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../utils/firebaseConfig";
import { authorizedEmails } from "../utils/authorizedEmails";
import { Mail, Lock, LogIn } from "lucide-react";

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (authorizedEmails.includes(user.email)) {
        onLoginSuccess(user);
      } else {
        setErrorMsg(
          "Para solicitar acceso, enviar mail a alexszer1986@gmail.com"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Para solicitar acceso, enviar mail a alexszer1986@gmail.com");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 border border-gray-700 p-8 rounded-xl shadow-xl w-full max-w-sm space-y-6"
      >
        <img src="/logo-3d.svg" alt="Logo" className="mx-auto h-40" />
        <h2 className="text-2xl font-bold text-center text-indigo-300 flex items-center justify-center">
          Iniciar Sesión
        </h2>

        {errorMsg && (
          <p className="text-red-400 bg-red-900/50 border border-red-700 p-2 rounded text-sm text-center">
            {errorMsg}
          </p>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-400" />
          <input
            type="email"
            className="w-full pl-10 p-3 rounded border border-gray-700 bg-gray-900 text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" />
          <input
            type="password"
            className="w-full pl-10 p-3 rounded border border-gray-700 bg-gray-900 text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded transition flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
