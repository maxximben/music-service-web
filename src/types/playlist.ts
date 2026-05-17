export type PlaylistSong = {
  songId: number;
  title: string;
  cover: string | null;
  url: string;
  duration: number | null;
  author: string;
  authors: string[];
};

export type PlaylistResponse = {
  playlistId: number;
  title: string;
  cover: string | null;
  countOfSongs: number;
  songs: PlaylistSong[];
};
