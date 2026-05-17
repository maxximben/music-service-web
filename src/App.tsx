import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { API_BASE_URL, signInRequest, signUpRequest } from './api/authApi';
import {
  createPlaylist,
  deletePlaylist,
  fetchHistory,
  fetchLibrary,
  fetchPlaylist,
  fetchSearch,
  fetchTrackUrl,
} from './api/musicApi';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import LandingScreen from './components/LandingScreen';
import PlayerBar from './components/PlayerBar';
import type { AuthPayload, Screen } from './types/auth';
import type { PlaylistResponse, PlaylistSong } from './types/playlist';
import type { SearchItem } from './types/search';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [tokens, setTokens] = useState<AuthPayload | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [libraryItems, setLibraryItems] = useState<SearchItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [createPlaylistError, setCreatePlaylistError] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState('');
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<SearchItem>({
    cover: null,
    name: 'Ничего не играет',
    type: 'Track',
    author: 'Выберите трек в поиске',
    id: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hideSearchTimeoutRef = useRef<number | null>(null);
  const playlistRequestControllerRef = useRef<AbortController | null>(null);
  const accessToken = useMemo(
    () => (typeof tokens?.accessToken === 'string' ? tokens.accessToken : ''),
    [tokens],
  );
  const isHomeScreen = screen === 'home' && accessToken.length > 0;

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
      setScreen('home');
      setSuccessText('');
      setErrorText('');
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    if (hideSearchTimeoutRef.current) {
      window.clearTimeout(hideSearchTimeoutRef.current);
      hideSearchTimeoutRef.current = null;
    }

    if (playlistRequestControllerRef.current) {
      playlistRequestControllerRef.current.abort();
      playlistRequestControllerRef.current = null;
    }

    setTokens(null);
    setPassword('');
    setSuccessText('');
    setErrorText('');
    setSearchQuery('');
    setSearchItems([]);
    setSearchError('');
    setLibraryItems([]);
    setLibraryError('');
    setLibraryLoading(false);
    setIsCreatingPlaylist(false);
    setCreatePlaylistError('');
    setPlaylist(null);
    setPlaylistError('');
    setPlaylistLoading(false);
    setDeletingPlaylistId(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentTrack({
      cover: null,
      name: 'Ничего не играет',
      type: 'Track',
      author: 'Выберите трек в поиске',
      id: 0,
    });
    setScreen('landing');
  };

  useEffect(() => {
    if (!isHomeScreen || !isSearchOpen) {
      return;
    }

    const controller = new AbortController();
    const trimmedQuery = searchQuery.trim();

    const loadSearchData = async () => {
      setIsSearchLoading(true);
      setSearchError('');
      if (trimmedQuery.length > 0) {
        // Hide history immediately once user starts typing.
        setSearchItems([]);
      }

      try {
        const response =
          trimmedQuery.length === 0
            ? await fetchHistory(accessToken, controller.signal)
            : await fetchSearch(accessToken, trimmedQuery, controller.signal);
        setSearchItems(response.items ?? []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Не удалось загрузить результаты поиска.';
        setSearchError(message);
        setSearchItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    };

    void loadSearchData();

    return () => {
      controller.abort();
    };
  }, [isHomeScreen, isSearchOpen, searchQuery, accessToken]);

  useEffect(() => {
    if (!isHomeScreen) {
      return;
    }

    const controller = new AbortController();
    setLibraryLoading(true);
    setLibraryError('');

    void fetchLibrary(accessToken, controller.signal)
      .then((response) => {
        setLibraryItems(response.items ?? []);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Не удалось загрузить библиотеку.';
        setLibraryError(message);
        setLibraryItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLibraryLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isHomeScreen, accessToken]);

  useEffect(() => {
    return () => {
      if (playlistRequestControllerRef.current) {
        playlistRequestControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const onDurationChange = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);
    };
    const onEnded = () => {
      setIsPlaying(false);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onDurationChange);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      if (hideSearchTimeoutRef.current) {
        window.clearTimeout(hideSearchTimeoutRef.current);
      }

      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onDurationChange);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audioRef.current = null;
    };
  }, []);

  const onSearchFocus = () => {
    if (hideSearchTimeoutRef.current) {
      window.clearTimeout(hideSearchTimeoutRef.current);
      hideSearchTimeoutRef.current = null;
    }
    setIsSearchOpen(true);
  };

  const onSearchBlur = () => {
    hideSearchTimeoutRef.current = window.setTimeout(() => {
      setIsSearchOpen(false);
      hideSearchTimeoutRef.current = null;
    }, 150);
  };

  const onSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setIsSearchOpen(true);
  };

  const onTrackClick = async (item: SearchItem) => {
    if (!accessToken) {
      return;
    }

    if (item.type !== 'Track') {
      setSearchError('Сейчас можно воспроизводить только треки.');
      return;
    }

    try {
      setSearchError('');
      const trackUrlResponse = await fetchTrackUrl(accessToken, item.id);
      const trackUrl = trackUrlResponse.trim().replace(/^"(.*)"$/, '$1');
      const resolvedTrackUrl =
        trackUrl.startsWith('http://') || trackUrl.startsWith('https://')
          ? trackUrl
          : new URL(trackUrl, API_BASE_URL).toString();

      if (!audioRef.current) {
        return;
      }

      setCurrentTime(0);
      setDuration(0);
      audioRef.current.src = resolvedTrackUrl;
      await audioRef.current.play();
      setCurrentTrack(item);
      setIsPlaying(true);
      setIsSearchOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось запустить трек.';
      setSearchError(message);
      setIsPlaying(false);
    }
  };

  const onPlaylistSongClick = async (song: PlaylistSong) => {
    if (!audioRef.current) {
      return;
    }

    const rawUrl = song.url?.trim();
    if (!rawUrl) {
      setPlaylistError('У трека отсутствует ссылка на аудио.');
      return;
    }

    const resolvedTrackUrl =
      rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : new URL(rawUrl, API_BASE_URL).toString();

    try {
      setPlaylistError('');
      setCurrentTime(0);
      setDuration(0);
      audioRef.current.src = resolvedTrackUrl;
      await audioRef.current.play();
      setCurrentTrack({
        cover: song.cover,
        name: song.title,
        type: 'Track',
        author: song.author,
        id: song.songId,
      });
      setIsPlaying(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось запустить трек из плейлиста.';
      setPlaylistError(message);
      setIsPlaying(false);
    }
  };

  const openPlaylist = async (playlistId: number) => {
    if (!accessToken) {
      return;
    }

    if (playlistRequestControllerRef.current) {
      playlistRequestControllerRef.current.abort();
    }

    const controller = new AbortController();
    playlistRequestControllerRef.current = controller;

    try {
      setPlaylistLoading(true);
      setPlaylistError('');
      const playlistResponse = await fetchPlaylist(accessToken, playlistId, controller.signal);
      setPlaylist(playlistResponse);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Не удалось загрузить плейлист.';
      setPlaylistError(message);
      setPlaylist(null);
    } finally {
      if (!controller.signal.aborted) {
        setPlaylistLoading(false);
      }
    }
  };

  const onSearchItemClick = async (item: SearchItem) => {
    if (item.type === 'Track') {
      await onTrackClick(item);
      return;
    }

    if (item.type === 'Playlist' || item.type === 'Album') {
      await openPlaylist(item.id);
      setIsSearchOpen(false);
      return;
    }
  };

  const onLibraryItemClick = async (item: SearchItem) => {
    if (item.type === 'Track') {
      await onTrackClick(item);
      return;
    }

    if (item.type !== 'Playlist' && item.type !== 'Album') {
      return;
    }

    await openPlaylist(item.id);
  };

  const onCreatePlaylist = async (title: string) => {
    if (!accessToken) {
      setCreatePlaylistError('Сначала войдите в аккаунт.');
      throw new Error('Missing access token');
    }

    try {
      setIsCreatingPlaylist(true);
      setCreatePlaylistError('');
      const createdPlaylist = await createPlaylist(accessToken, title);
      setPlaylist(createdPlaylist);
      setPlaylistError('');

      const libraryResponse = await fetchLibrary(accessToken);
      setLibraryItems(libraryResponse.items ?? []);
      setLibraryError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать плейлист.';
      setCreatePlaylistError(message);
      throw error;
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const onDeletePlaylist = async (playlistId: number) => {
    if (!accessToken) {
      setPlaylistError('Сначала войдите в аккаунт.');
      return;
    }

    try {
      setDeletingPlaylistId(playlistId);
      setPlaylistError('');
      await deletePlaylist(accessToken, playlistId);
      setPlaylist((currentPlaylist) => (currentPlaylist?.playlistId === playlistId ? null : currentPlaylist));

      const libraryResponse = await fetchLibrary(accessToken);
      setLibraryItems(libraryResponse.items ?? []);
      setLibraryError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить плейлист.';
      setPlaylistError(message);
    } finally {
      setDeletingPlaylistId(null);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    void audioRef.current.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  };

  const seekTrack = (nextTime: number) => {
    if (!audioRef.current || !Number.isFinite(nextTime)) {
      return;
    }

    const maxTime = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : duration;
    const clampedTime = Math.max(0, Math.min(nextTime, maxTime || nextTime));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  useEffect(() => {
    if (!isHomeScreen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;

      if (isTypingTarget) {
        return;
      }

      if (!audioRef.current || !audioRef.current.src) {
        return;
      }

      event.preventDefault();
      togglePlay();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHomeScreen, isPlaying, duration]);

  return (
    <main className={isHomeScreen ? 'page withPlayer homeLayout' : 'page'}>
      <section className={isHomeScreen ? 'shell shellHome' : 'shell'}>
        {screen === 'landing' ? (
          <LandingScreen onSignUp={() => goToAuthScreen('sign-up')} onSignIn={() => goToAuthScreen('sign-in')} />
        ) : screen === 'home' ? (
          <HomeScreen
            query={searchQuery}
            isDropdownOpen={isSearchOpen}
            isLoading={isSearchLoading}
            errorText={searchError}
            items={searchItems}
            libraryItems={libraryItems}
            libraryLoading={libraryLoading}
            libraryError={libraryError}
            isCreatingPlaylist={isCreatingPlaylist}
            createPlaylistError={createPlaylistError}
            deletingPlaylistId={deletingPlaylistId}
            playlist={playlist}
            playlistLoading={playlistLoading}
            playlistError={playlistError}
            onQueryChange={onSearchQueryChange}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            onSearchItemClick={onSearchItemClick}
            onLibraryItemClick={onLibraryItemClick}
            onPlaylistSongClick={onPlaylistSongClick}
            onCreatePlaylist={onCreatePlaylist}
            onDeletePlaylist={onDeletePlaylist}
          />
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
      {isHomeScreen ? (
        <PlayerBar
          isPlaying={isPlaying}
          trackTitle={currentTrack.name}
          trackArtist={currentTrack.author}
          trackCover={currentTrack.cover}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onSeek={seekTrack}
        />
      ) : null}
    </main>
  );
}

export default App;
