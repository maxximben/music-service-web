import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { API_BASE_URL, signInRequest, signUpRequest } from './api/authApi';
import {
  addAlbumToLibrary,
  addSongToPlaylist,
  createPlaylist,
  createTrackRadio,
  deletePlaylist,
  fetchHistory,
  fetchLibrary,
  fetchPlaylist,
  fetchSearch,
  fetchTrackUrl,
  removeSongFromPlaylist,
  renamePlaylist,
} from './api/musicApi';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import LandingScreen from './components/LandingScreen';
import PlayerBar from './components/PlayerBar';
import type { AuthPayload, Screen } from './types/auth';
import type { PlaylistResponse, PlaylistSong } from './types/playlist';
import type { SearchItem } from './types/search';

type PlaylistPlaybackQueue = {
  playlistId: number;
  songs: PlaylistSong[];
  index: number;
};

function getShuffledNextIndex(queue: PlaylistPlaybackQueue): number {
  if (queue.songs.length < 2) {
    return -1;
  }

  const offset = Math.floor(Math.random() * (queue.songs.length - 1)) + 1;
  return (queue.index + offset) % queue.songs.length;
}

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
  const [libraryAlbumActionId, setLibraryAlbumActionId] = useState<number | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [createPlaylistError, setCreatePlaylistError] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState('');
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<number | null>(null);
  const [renamingPlaylistId, setRenamingPlaylistId] = useState<number | null>(null);
  const [renamePlaylistError, setRenamePlaylistError] = useState('');
  const [playlistTrackActionSongId, setPlaylistTrackActionSongId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlistPlaybackQueue, setPlaylistPlaybackQueue] = useState<PlaylistPlaybackQueue | null>(null);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isRepeatTrackEnabled, setIsRepeatTrackEnabled] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SearchItem>({
    cover: null,
    name: 'Ничего не играет',
    type: 'Track',
    author: 'Выберите трек в поиске',
    id: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shuffleRef = useRef(false);
  const repeatTrackRef = useRef(false);
  const playlistPlaybackQueueRef = useRef<PlaylistPlaybackQueue | null>(null);
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
    setLibraryAlbumActionId(null);
    setIsCreatingPlaylist(false);
    setCreatePlaylistError('');
    setPlaylist(null);
    setPlaylistError('');
    setPlaylistLoading(false);
    setDeletingPlaylistId(null);
    setRenamingPlaylistId(null);
    setRenamePlaylistError('');
    setPlaylistTrackActionSongId(null);
    setPlaylistPlaybackQueue(null);
    playlistPlaybackQueueRef.current = null;
    setIsShuffleEnabled(false);
    shuffleRef.current = false;
    setIsRepeatTrackEnabled(false);
    repeatTrackRef.current = false;
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
    playlistPlaybackQueueRef.current = playlistPlaybackQueue;

    if (playlistPlaybackQueue === null && shuffleRef.current) {
      shuffleRef.current = false;
      setIsShuffleEnabled(false);
    }
  }, [playlistPlaybackQueue]);

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
      if (repeatTrackRef.current && audio.src) {
        audio.currentTime = 0;
        setCurrentTime(0);
        void audio.play().then(
          () => setIsPlaying(true),
          () => setIsPlaying(false),
        );
        return;
      }

      const currentQueue = playlistPlaybackQueueRef.current;
      const nextIndex = currentQueue
        ? shuffleRef.current
          ? getShuffledNextIndex(currentQueue)
          : currentQueue.index + 1
        : -1;
      const nextSong = currentQueue?.songs[nextIndex];

      if (currentQueue && nextSong) {
        const rawUrl = nextSong.url?.trim();
        if (!rawUrl) {
          setPlaylistError('У следующего трека отсутствует ссылка на аудио.');
          setIsPlaying(false);
          return;
        }

        const resolvedTrackUrl =
          rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
            ? rawUrl
            : new URL(rawUrl, API_BASE_URL).toString();

        const nextQueue = {
          playlistId: currentQueue.playlistId,
          songs: currentQueue.songs,
          index: nextIndex,
        };

        setPlaylistError('');
        setCurrentTime(0);
        setDuration(0);
        audio.src = resolvedTrackUrl;
        setCurrentTrack({
          cover: nextSong.cover,
          name: nextSong.title,
          type: 'Track',
          author: nextSong.author,
          id: nextSong.songId,
        });
        playlistPlaybackQueueRef.current = nextQueue;
        setPlaylistPlaybackQueue(nextQueue);
        void audio.play().then(
          () => setIsPlaying(true),
          () => setIsPlaying(false),
        );
        return;
      }

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
      playlistPlaybackQueueRef.current = null;
      shuffleRef.current = false;
      setIsShuffleEnabled(false);
      setPlaylistPlaybackQueue(null);
      setIsPlaying(true);
      setIsSearchOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось запустить трек.';
      setSearchError(message);
      setIsPlaying(false);
    }
  };

  const playPlaylistSong = async (song: PlaylistSong, nextQueue: PlaylistPlaybackQueue | null) => {
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
      playlistPlaybackQueueRef.current = nextQueue;
      setPlaylistPlaybackQueue(nextQueue);
      setIsPlaying(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось запустить трек из плейлиста.';
      setPlaylistError(message);
      setIsPlaying(false);
    }
  };

  const onPlaylistSongClick = async (song: PlaylistSong) => {
    const songIndex = playlist?.songs.findIndex((playlistSong) => playlistSong.songId === song.songId) ?? -1;
    const nextQueue =
      playlist && songIndex >= 0
        ? {
            playlistId: playlist.playlistId,
            songs: playlist.songs,
            index: songIndex,
          }
        : null;

    await playPlaylistSong(song, nextQueue);
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

  const onAddAlbumToLibrary = async (albumId: number) => {
    if (!accessToken) {
      return;
    }

    try {
      setLibraryAlbumActionId(albumId);
      setLibraryError('');
      const libraryResponse = await addAlbumToLibrary(accessToken, albumId);
      setLibraryItems(libraryResponse.items ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить альбом в медиатеку.';
      setLibraryError(message);
    } finally {
      setLibraryAlbumActionId(null);
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
      setPlaylistPlaybackQueue((currentQueue) => {
        const nextQueue = currentQueue?.playlistId === playlistId ? null : currentQueue;
        playlistPlaybackQueueRef.current = nextQueue;
        return nextQueue;
      });

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

  const onRenamePlaylist = async (playlistId: number, title: string) => {
    if (!accessToken) {
      setRenamePlaylistError('Сначала войдите в аккаунт.');
      throw new Error('Missing access token');
    }

    try {
      setRenamingPlaylistId(playlistId);
      setRenamePlaylistError('');
      const renamedPlaylist = await renamePlaylist(accessToken, playlistId, title);
      setPlaylist((currentPlaylist) =>
        currentPlaylist?.playlistId === playlistId ? renamedPlaylist : currentPlaylist,
      );

      const libraryResponse = await fetchLibrary(accessToken);
      setLibraryItems(libraryResponse.items ?? []);
      setLibraryError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось переименовать плейлист.';
      setRenamePlaylistError(message);
      throw error;
    } finally {
      setRenamingPlaylistId(null);
    }
  };

  const onRemoveSongFromPlaylist = async (songId: number) => {
    if (!accessToken || !playlist) {
      return;
    }

    try {
      setPlaylistTrackActionSongId(songId);
      setPlaylistError('');
      const updatedPlaylist = await removeSongFromPlaylist(accessToken, playlist.playlistId, songId);
      setPlaylist(updatedPlaylist);
      setPlaylistPlaybackQueue((currentQueue) => {
        if (currentQueue?.playlistId !== updatedPlaylist.playlistId) {
          return currentQueue;
        }

        const nextIndex = updatedPlaylist.songs.findIndex((playlistSong) => playlistSong.songId === currentTrack.id);
        if (nextIndex < 0) {
          playlistPlaybackQueueRef.current = null;
          return null;
        }

        const nextQueue = {
          playlistId: updatedPlaylist.playlistId,
          songs: updatedPlaylist.songs,
          index: nextIndex,
        };
        playlistPlaybackQueueRef.current = nextQueue;
        return nextQueue;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить трек из плейлиста.';
      setPlaylistError(message);
    } finally {
      setPlaylistTrackActionSongId(null);
    }
  };

  const onAddSongToPlaylist = async (songId: number, targetPlaylistId: number) => {
    if (!accessToken) {
      return;
    }

    try {
      setPlaylistTrackActionSongId(songId);
      setPlaylistError('');
      const updatedPlaylist = await addSongToPlaylist(accessToken, targetPlaylistId, songId);
      setPlaylist((currentPlaylist) =>
        currentPlaylist?.playlistId === targetPlaylistId ? updatedPlaylist : currentPlaylist,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить трек в плейлист.';
      setPlaylistError(message);
    } finally {
      setPlaylistTrackActionSongId(null);
    }
  };

  const onCreateTrackRadio = async (songId: number) => {
    if (!accessToken) {
      return;
    }

    try {
      setPlaylistTrackActionSongId(songId);
      setPlaylistError('');
      const radioPlaylist = await createTrackRadio(accessToken, songId);
      setPlaylist(radioPlaylist);

      const libraryResponse = await fetchLibrary(accessToken);
      setLibraryItems(libraryResponse.items ?? []);
      setLibraryError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать радио по треку.';
      setPlaylistError(message);
    } finally {
      setPlaylistTrackActionSongId(null);
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

  const toggleRepeatTrack = () => {
    setIsRepeatTrackEnabled((currentValue) => {
      const nextValue = !currentValue;
      repeatTrackRef.current = nextValue;
      return nextValue;
    });
  };

  const toggleShuffle = () => {
    if (!playlistPlaybackQueue) {
      return;
    }

    setIsShuffleEnabled((currentValue) => {
      const nextValue = !currentValue;
      shuffleRef.current = nextValue;
      return nextValue;
    });
  };

  const playAdjacentPlaylistTrack = async (direction: -1 | 1) => {
    if (!playlistPlaybackQueue) {
      return;
    }

    const nextIndex =
      direction > 0 && shuffleRef.current
        ? getShuffledNextIndex(playlistPlaybackQueue)
        : playlistPlaybackQueue.index + direction;
    const nextSong = playlistPlaybackQueue.songs[nextIndex];
    if (!nextSong) {
      return;
    }

    await playPlaylistSong(nextSong, {
      playlistId: playlistPlaybackQueue.playlistId,
      songs: playlistPlaybackQueue.songs,
      index: nextIndex,
    });
  };

  const canShuffle = playlistPlaybackQueue !== null;
  const canGoPrevious = playlistPlaybackQueue !== null && playlistPlaybackQueue.index > 0;
  const canGoNext =
    playlistPlaybackQueue !== null &&
    (isShuffleEnabled ? playlistPlaybackQueue.songs.length > 1 : playlistPlaybackQueue.index < playlistPlaybackQueue.songs.length - 1);

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
            libraryAlbumActionId={libraryAlbumActionId}
            isCreatingPlaylist={isCreatingPlaylist}
            createPlaylistError={createPlaylistError}
            deletingPlaylistId={deletingPlaylistId}
            renamingPlaylistId={renamingPlaylistId}
            renamePlaylistError={renamePlaylistError}
            playlist={playlist}
            playlistLoading={playlistLoading}
            playlistError={playlistError}
            playlistTrackActionSongId={playlistTrackActionSongId}
            playingSongId={currentTrack.type === 'Track' ? currentTrack.id : null}
            onQueryChange={onSearchQueryChange}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            onSearchItemClick={onSearchItemClick}
            onLibraryItemClick={onLibraryItemClick}
            onPlaylistSongClick={onPlaylistSongClick}
            onAddAlbumToLibrary={onAddAlbumToLibrary}
            onCreatePlaylist={onCreatePlaylist}
            onDeletePlaylist={onDeletePlaylist}
            onRenamePlaylist={onRenamePlaylist}
            onRemoveSongFromPlaylist={onRemoveSongFromPlaylist}
            onAddSongToPlaylist={onAddSongToPlaylist}
            onCreateTrackRadio={onCreateTrackRadio}
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
          canShuffle={canShuffle}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          isShuffleEnabled={isShuffleEnabled}
          isRepeatTrackEnabled={isRepeatTrackEnabled}
          onTogglePlay={togglePlay}
          onSeek={seekTrack}
          onToggleShuffle={toggleShuffle}
          onPreviousTrack={() => void playAdjacentPlaylistTrack(-1)}
          onNextTrack={() => void playAdjacentPlaylistTrack(1)}
          onToggleRepeatTrack={toggleRepeatTrack}
        />
      ) : null}
    </main>
  );
}

export default App;
