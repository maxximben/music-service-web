import type { FormEvent } from 'react';
import type { AuthPayload, Screen } from '../types/auth';
import { API_BASE_URL } from '../api/authApi';

type AuthScreenProps = {
  screen: Screen;
  email: string;
  username: string;
  password: string;
  isLoading: boolean;
  errorText: string;
  successText: string;
  tokens: AuthPayload | null;
  onEmailChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onLogout: () => void;
};

function AuthScreen({
  screen,
  email,
  username,
  password,
  isLoading,
  errorText,
  successText,
  tokens,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onBack,
  onLogout,
}: AuthScreenProps) {
  const isSignUp = screen === 'sign-up';
  const title = isSignUp ? 'Регистрация' : 'Вход';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="card">
      <h1 className="title">{title}</h1>
      <p className="devHint">API: {API_BASE_URL}</p>

      <form onSubmit={handleSubmit} className="form">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={isLoading}
        />

        {isSignUp ? (
          <input
            className="input"
            type="text"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Username"
            autoComplete="username"
            disabled={isLoading}
          />
        ) : null}

        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          disabled={isLoading}
        />

        <button className="primaryButton submitButton" type="submit" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : isSignUp ? 'Создать аккаунт' : 'Войти'}
        </button>
      </form>

      <button className="ghostButton backButton" type="button" onClick={onBack}>
        Назад
      </button>

      {errorText ? <p className="errorText">{errorText}</p> : null}
      {successText ? <p className="successText">{successText}</p> : null}

      {tokens ? (
        <div className="tokenCard">
          <p className="devHint">Response payload</p>
          <pre className="tokenText">{JSON.stringify(tokens, null, 2)}</pre>
          <button className="ghostButton" type="button" onClick={onLogout}>
            Выйти
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AuthScreen;
