import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { PlaylistResponse, PlaylistSong } from '../types/playlist';
import type { SearchItem } from '../types/search';
import LibraryPanel from './LibraryPanel';
import PlaylistView from './PlaylistView';
import './HomeScreen.css';

type HomeScreenProps = {
  query: string;
  isDropdownOpen: boolean;
  isLoading: boolean;
  errorText: string;
  items: SearchItem[];
  libraryItems: SearchItem[];
  libraryLoading: boolean;
  libraryError: string;
  libraryAlbumActionId: number | null;
  isCreatingPlaylist: boolean;
  createPlaylistError: string;
  deletingPlaylistId: number | null;
  renamingPlaylistId: number | null;
  renamePlaylistError: string;
  playlist: PlaylistResponse | null;
  playlistLoading: boolean;
  playlistError: string;
  playlistTrackActionSongId: number | null;
  playingSongId: number | null;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSearchItemClick: (item: SearchItem) => void;
  onLibraryItemClick: (item: SearchItem) => void;
  onPlaylistSongClick: (song: PlaylistSong) => void;
  onAddAlbumToLibrary: (albumId: number) => Promise<void>;
  onCreatePlaylist: (title: string) => Promise<void>;
  onDeletePlaylist: (playlistId: number) => Promise<void>;
  onRenamePlaylist: (playlistId: number, title: string) => Promise<void>;
  onRemoveSongFromPlaylist: (songId: number) => Promise<void>;
  onAddSongToPlaylist: (songId: number, targetPlaylistId: number) => Promise<void>;
  onCreateTrackRadio: (songId: number) => Promise<void>;
};

function HomeScreen({
  query,
  isDropdownOpen,
  isLoading,
  errorText,
  items,
  libraryItems,
  libraryLoading,
  libraryError,
  libraryAlbumActionId,
  isCreatingPlaylist,
  createPlaylistError,
  deletingPlaylistId,
  renamingPlaylistId,
  renamePlaylistError,
  playlist,
  playlistLoading,
  playlistError,
  playlistTrackActionSongId,
  playingSongId,
  onQueryChange,
  onFocus,
  onBlur,
  onSearchItemClick,
  onLibraryItemClick,
  onPlaylistSongClick,
  onAddAlbumToLibrary,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onRemoveSongFromPlaylist,
  onAddSongToPlaylist,
  onCreateTrackRadio,
}: HomeScreenProps) {
  const isHistoryMode = query.trim().length === 0;
  const visibleItems = isHistoryMode ? items.slice(0, 8) : items;
  const hasItems = visibleItems.length > 0;
  const showEmpty = !isLoading && !hasItems && !isHistoryMode;
  const showHistoryHint = isHistoryMode && hasItems;
  const [activeIndex, setActiveIndex] = useState(-1);
  const [openSearchMenuKey, setOpenSearchMenuKey] = useState<string | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const playlistItems = libraryItems.filter((libraryItem) => libraryItem.type === 'Playlist');

  useEffect(() => {
    if (!isDropdownOpen || !hasItems) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((previous) => {
      if (previous < 0) {
        return 0;
      }

      return Math.min(previous, visibleItems.length - 1);
    });
  }, [isDropdownOpen, hasItems, visibleItems.length, query]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    itemRefs.current[activeIndex]?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex]);

  useEffect(() => {
    if (openSearchMenuKey === null) {
      return;
    }

    const closeMenuOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.searchItemActions')) {
        return;
      }

      setOpenSearchMenuKey(null);
    };

    const closeMenuOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSearchMenuKey(null);
      }
    };

    document.addEventListener('pointerdown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [openSearchMenuKey]);

  useEffect(() => {
    if (!isDropdownOpen) {
      setOpenSearchMenuKey(null);
    }
  }, [isDropdownOpen]);

  const addSearchSongToPlaylist = async (songId: number, targetPlaylistId: number) => {
    setOpenSearchMenuKey(null);
    await onAddSongToPlaylist(songId, targetPlaylistId);
  };

  const addSearchAlbumToLibrary = async (albumId: number) => {
    setOpenSearchMenuKey(null);
    await onAddAlbumToLibrary(albumId);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || !hasItems) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((previous) => Math.min(previous + 1, visibleItems.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((previous) => Math.max(previous - 1, 0));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const selected = visibleItems[activeIndex];
      if (selected) {
        onSearchItemClick(selected);
      }
    }
  };

  return (
    <div className="homePage">
      <div className="homeTopBar">
        <div className="searchShell" onBlur={onBlur}>
          <div className="searchInputWrap">
            <span className="searchIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m16.2 16.2 4 4" />
              </svg>
            </span>
            <input
              className="searchInput"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onFocus={onFocus}
              onKeyDown={onInputKeyDown}
              placeholder="Что хочешь включить?"
              autoComplete="off"
            />
          </div>

          {isDropdownOpen ? (
            <div className="searchDropdown">
              {errorText ? <p className="searchError">{errorText}</p> : null}

              {hasItems ? (
                <ul className="searchList">
                  {visibleItems.map((item, index) => (
                    <li key={`${item.type}-${item.id}-${index}`}>
                      <div
                        className={`searchItemRow${
                          item.type === 'Track' || item.type === 'Album' ? '' : ' searchItemRowPlain'
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <button
                          type="button"
                          className={`searchItem${activeIndex === index ? ' searchItemActive' : ''}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => onSearchItemClick(item)}
                          ref={(element) => {
                            itemRefs.current[index] = element;
                          }}
                        >
                          <span className="searchItemCover" aria-hidden="true">
                            {item.cover ? <img src={item.cover} alt="" /> : null}
                          </span>
                          <span className="searchItemMeta">
                            <span className="searchItemName">{item.name}</span>
                            <span className="searchItemAuthor">
                              <span className="searchItemAuthorText">{item.author}</span>
                            </span>
                          </span>
                          <span className="searchItemType">{item.type}</span>
                        </button>

                        {item.type === 'Track' || item.type === 'Album' ? (
                          <div className="searchItemActions">
                            <button
                              type="button"
                              className="searchItemMenuButton"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={(event) => {
                                event.stopPropagation();
                                const itemKey = `${item.type}-${item.id}-${index}`;
                                setOpenSearchMenuKey((currentKey) => (currentKey === itemKey ? null : itemKey));
                              }}
                              aria-label={`Действия с треком ${item.name}`}
                              aria-expanded={openSearchMenuKey === `${item.type}-${item.id}-${index}`}
                            >
                              ...
                            </button>
                            {openSearchMenuKey === `${item.type}-${item.id}-${index}` ? (
                              <div
                                className="searchItemMenu"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {item.type === 'Track' ? (
                                  <div className="searchItemSubmenuWrap">
                                    <button
                                      type="button"
                                      className="searchItemSubmenuTrigger"
                                      disabled={playlistTrackActionSongId !== null}
                                    >
                                      <span>Добавить в плейлист</span>
                                      <span aria-hidden="true">›</span>
                                    </button>
                                    <div className="searchItemSubmenu">
                                      {playlistItems.length > 0 ? (
                                        <div className="searchItemTargets">
                                          {playlistItems.map((targetPlaylist) => (
                                            <button
                                              key={targetPlaylist.id}
                                              type="button"
                                              className="searchItemTarget"
                                              onClick={() => void addSearchSongToPlaylist(item.id, targetPlaylist.id)}
                                              disabled={playlistTrackActionSongId !== null}
                                            >
                                              {targetPlaylist.name}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="searchItemMenuHint">Нет плейлистов</p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="searchItemMenuOption"
                                    onClick={() => void addSearchAlbumToLibrary(item.id)}
                                    disabled={libraryAlbumActionId !== null}
                                  >
                                    {libraryAlbumActionId === item.id ? 'Добавление...' : 'Добавить в медиатеку'}
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {showHistoryHint ? <p className="searchHint searchHintSecondary">История прослушиваний</p> : null}
              {showEmpty ? <p className="searchHint">Ничего не найдено</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="homeBody">
        <div className="homeLibraryArea">
          <LibraryPanel
            items={libraryItems}
            isLoading={libraryLoading}
            errorText={libraryError}
            isCreatingPlaylist={isCreatingPlaylist}
            createPlaylistError={createPlaylistError}
            deletingPlaylistId={deletingPlaylistId}
            renamingPlaylistId={renamingPlaylistId}
            renamePlaylistError={renamePlaylistError}
            onItemClick={onLibraryItemClick}
            onCreatePlaylist={onCreatePlaylist}
            onDeletePlaylist={onDeletePlaylist}
            onRenamePlaylist={onRenamePlaylist}
          />
        </div>
        <div className="homeMainArea">
          <PlaylistView
            playlist={playlist}
            isLoading={playlistLoading}
            errorText={playlistError}
            availablePlaylists={libraryItems.filter(
              (item) => item.type === 'Playlist' && item.id !== playlist?.playlistId,
            )}
            actionSongId={playlistTrackActionSongId}
            playingSongId={playingSongId}
            onSongClick={onPlaylistSongClick}
            onRemoveSong={onRemoveSongFromPlaylist}
            onAddSongToPlaylist={onAddSongToPlaylist}
            onCreateTrackRadio={onCreateTrackRadio}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
