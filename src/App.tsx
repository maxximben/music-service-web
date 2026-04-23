import { useState } from 'react';
import './App.css';
import { signInRequest, signUpRequest } from './api/authApi';
import AuthScreen from './components/AuthScreen';
import LandingScreen from './components/LandingScreen';
import type { AuthPayload, Screen } from './types/auth';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [tokens, setTokens] = useState<AuthPayload | null>(null);

  const resetMessages = () => {
    setErrorText('');
    setSuccessText('');
  };

  const goToAuthScreen = (next: Extract<Screen, 'sign-in' | 'sign-up'>) => {
    setScreen(next);
    setPassword('');
    resetMessages();
  };

  const signIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorText('Введите email и пароль.');
      return;
    }

    setIsLoading(true);
    resetMessages();

    try {
      const payload = await signInRequest(trimmedEmail, password);
      setTokens(payload);
      setSuccessText('Вход выполнен успешно.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить вход.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    if (!trimmedEmail || !trimmedUsername || !password) {
      setErrorText('Заполните email, username и пароль.');
      return;
    }

    setIsLoading(true);
    resetMessages();

    try {
      await signUpRequest(trimmedEmail, trimmedUsername, password);
      setSuccessText('Регистрация прошла успешно. Теперь можно войти.');
      setScreen('sign-in');
      setPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить регистрацию.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAuthForm = () => {
    if (screen === 'sign-up') {
      void signUp();
    } else {
      void signIn();
    }
  };

  const logout = () => {
    setTokens(null);
    setPassword('');
    setSuccessText('');
    setErrorText('');
    setScreen('landing');
  };

  return (
    <main className="page">
      <section className="shell">
        {screen === 'landing' ? (
          <LandingScreen onSignUp={() => goToAuthScreen('sign-up')} onSignIn={() => goToAuthScreen('sign-in')} />
        ) : (
          <AuthScreen
            screen={screen}
            email={email}
            username={username}
            password={password}
            isLoading={isLoading}
            errorText={errorText}
            successText={successText}
            tokens={tokens}
            onEmailChange={setEmail}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={submitAuthForm}
            onBack={() => setScreen('landing')}
            onLogout={logout}
          />
        )}
      </section>
    </main>
  );
}

export default App;
