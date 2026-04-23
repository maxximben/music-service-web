export type PlaylistSong = {
  songId: number;
  title: string;
  userId: number;
  cover: string | null;
  url: string;
  duration: number;
  author: string;
};

export type PlaylistResponse = {
  playlistId: number;
  title: string;
  cover: string | null;
  countOfSongs: number;
  songs: PlaylistSong[];
};
