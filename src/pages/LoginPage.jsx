import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../utils/firebaseConfig';
import { authorizedEmails } from '../utils/authorizedEmails';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (authorizedEmails.includes(user.email)) {
        onLoginSuccess(user);
      } else {
        setErrorMsg("Este usuario no está autorizado para gestionar datos. Para pedir autorización, enviar mail a alexszer1986@gmail.com.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Email o contraseña inválidos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-indigo-200 p-4">
      <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm space-y-6 border border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-300">Iniciar Sesión</h2>

        {errorMsg && (
          <p className="text-red-600 bg-red-100 dark:bg-red-800 dark:text-red-200 p-2 rounded text-sm text-center">
            {errorMsg}
          </p>
        )}

        <input
          type="email"
          className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded transition"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
