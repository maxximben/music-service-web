import { useEffect, useState } from 'react';
import type { PlaylistResponse, PlaylistSong } from '../types/playlist';
import type { SearchItem } from '../types/search';
import './PlaylistView.css';

type PlaylistViewProps = {
  playlist: PlaylistResponse | null;
  isLoading: boolean;
  errorText: string;
  availablePlaylists: SearchItem[];
  actionSongId: number | null;
  playingSongId: number | null;
  onSongClick: (song: PlaylistSong) => void;
  onRemoveSong: (songId: number) => Promise<void>;
  onAddSongToPlaylist: (songId: number, targetPlaylistId: number) => Promise<void>;
  onCreateTrackRadio: (songId: number) => Promise<void>;
};

function formatDuration(rawDuration: number | null): string {
  if (rawDuration === null) {
    return '--:--';
  }

  if (!Number.isFinite(rawDuration) || rawDuration <= 0) {
    return '0:00';
  }

  const durationSeconds = rawDuration > 10000 ? Math.floor(rawDuration / 1000) : Math.floor(rawDuration);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function PlaylistView({
  playlist,
  isLoading,
  errorText,
  availablePlaylists,
  actionSongId,
  playingSongId,
  onSongClick,
  onRemoveSong,
  onAddSongToPlaylist,
  onCreateTrackRadio,
}: PlaylistViewProps) {
  const [openMenuSongId, setOpenMenuSongId] = useState<number | null>(null);

  useEffect(() => {
    if (openMenuSongId === null) {
      return;
    }

    const closeMenuOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.playlistTrackActions')) {
        return;
      }

      setOpenMenuSongId(null);
    };

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuSongId(null);
      }
    };

    document.addEventListener('pointerdown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [openMenuSongId]);

  if (isLoading) {
    return <section className="playlistViewState">Загрузка плейлиста...</section>;
  }

  if (errorText) {
    return <section className="playlistViewState playlistViewError">{errorText}</section>;
  }

  if (!playlist) {
    return <section className="playlistViewState">Выберите плейлист или альбом в библиотеке</section>;
  }

  const removeSong = async (song: PlaylistSong) => {
    setOpenMenuSongId(null);
    await onRemoveSong(song.songId);
  };

  const addSongToPlaylist = async (song: PlaylistSong, targetPlaylistId: number) => {
    setOpenMenuSongId(null);
    await onAddSongToPlaylist(song.songId, targetPlaylistId);
  };

  const createTrackRadio = async (song: PlaylistSong) => {
    setOpenMenuSongId(null);
    await onCreateTrackRadio(song.songId);
  };

  return (
    <section className="playlistView">
      <header className="playlistHeader">
        <div className="playlistCover" aria-hidden="true">
          {playlist.cover ? <img src={playlist.cover} alt="" /> : null}
        </div>
        <div className="playlistMeta">
          <p className="playlistHint">Плейлист</p>
          <h2 className="playlistTitle">{playlist.title}</h2>
          <p className="playlistCount">Треков: {playlist.countOfSongs}</p>
        </div>
      </header>

      <div className="playlistTableWrap">
        <table className="playlistTable">
          <thead>
            <tr>
              <th className="playlistColIndex">#</th>
              <th className="playlistColCover" />
              <th>Название</th>
              <th>Автор</th>
              <th className="playlistColDuration">Длительность</th>
              <th className="playlistColActions" />
            </tr>
          </thead>
          <tbody>
            {playlist.songs.map((song, index) => (
              <tr key={song.songId} className="playlistRow" onClick={() => onSongClick(song)}>
                <td className="playlistColIndex">{index + 1}</td>
                <td className="playlistColCover">
                  <span className="playlistSongCover" aria-hidden="true">
                    {song.cover ? <img src={song.cover} alt="" /> : null}
                  </span>
                </td>
                <td
                  className={`playlistSongTitle${
                    playingSongId === song.songId ? ' playlistSongTitlePlaying' : ''
                  }`}
                >
                  {song.title}
                </td>
                <td className="playlistSongAuthor">
                  <span className="playlistSongAuthorText">{song.author}</span>
                </td>
                <td className="playlistColDuration">{formatDuration(song.duration)}</td>
                <td className="playlistColActions">
                  <div className="playlistTrackActions">
                    <button
                      type="button"
                      className="playlistMoreButton"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuSongId((currentId) => (currentId === song.songId ? null : song.songId));
                      }}
                      aria-label={`Действия с треком ${song.title}`}
                      aria-expanded={openMenuSongId === song.songId}
                    >
                      ...
                    </button>
                    {openMenuSongId === song.songId ? (
                      <div className="playlistTrackMenu" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="playlistTrackMenuDelete"
                          onClick={() => void removeSong(song)}
                          disabled={actionSongId !== null}
                        >
                          {actionSongId === song.songId ? 'Удаление...' : 'Удалить из плейлиста'}
                        </button>

                        <div className="playlistTrackMenuDivider" />
                        <button
                          type="button"
                          className="playlistTrackMenuRadio"
                          onClick={() => void createTrackRadio(song)}
                          disabled={actionSongId !== null}
                        >
                          {actionSongId === song.songId ? 'Создание радио...' : 'Радио по треку'}
                        </button>

                        <div className="playlistTrackMenuDivider" />
                        <div className="playlistTrackSubmenuWrap">
                          <button type="button" className="playlistTrackSubmenuTrigger" disabled={actionSongId !== null}>
                            <span>Добавить в плейлист</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          <div className="playlistTrackSubmenu">
                            {availablePlaylists.length > 0 ? (
                              <div className="playlistTrackTargets">
                                {availablePlaylists.map((targetPlaylist) => (
                                  <button
                                    key={targetPlaylist.id}
                                    type="button"
                                    className="playlistTrackTarget"
                                    onClick={() => void addSongToPlaylist(song, targetPlaylist.id)}
                                    disabled={actionSongId !== null}
                                  >
                                    {targetPlaylist.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="playlistTrackMenuHint">Нет других плейлистов</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PlaylistView;
