import type { PlaylistResponse, PlaylistSong } from '../types/playlist';
import './PlaylistView.css';

type PlaylistViewProps = {
  playlist: PlaylistResponse | null;
  isLoading: boolean;
  errorText: string;
  onSongClick: (song: PlaylistSong) => void;
};

function formatDuration(rawDuration: number): string {
  if (!Number.isFinite(rawDuration) || rawDuration <= 0) {
    return '0:00';
  }

  const durationSeconds = rawDuration > 10000 ? Math.floor(rawDuration / 1000) : Math.floor(rawDuration);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function PlaylistView({ playlist, isLoading, errorText, onSongClick }: PlaylistViewProps) {
  if (isLoading) {
    return <section className="playlistViewState">Загрузка плейлиста...</section>;
  }

  if (errorText) {
    return <section className="playlistViewState playlistViewError">{errorText}</section>;
  }

  if (!playlist) {
    return <section className="playlistViewState">Выберите плейлист или альбом в библиотеке</section>;
  }

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
                <td className="playlistSongTitle">{song.title}</td>
                <td className="playlistSongAuthor">
                  <span className="playlistSongAuthorText">{song.author}</span>
                </td>
                <td className="playlistColDuration">{formatDuration(song.duration)}</td>
                <td className="playlistColActions">
                  <button
                    type="button"
                    className="playlistMoreButton"
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Действия с треком"
                  >
                    ...
                  </button>
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
