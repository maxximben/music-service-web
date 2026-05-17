import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { SearchItem } from '../types/search';
import './LibraryPanel.css';

type LibraryTypeFilter = 'All' | 'Track' | 'Album' | 'Playlist';

type LibraryPanelProps = {
  items: SearchItem[];
  isLoading: boolean;
  errorText: string;
  isCreatingPlaylist: boolean;
  createPlaylistError: string;
  deletingPlaylistId: number | null;
  renamingPlaylistId: number | null;
  renamePlaylistError: string;
  onItemClick: (item: SearchItem) => void;
  onCreatePlaylist: (title: string) => Promise<void>;
  onDeletePlaylist: (playlistId: number) => Promise<void>;
  onRenamePlaylist: (playlistId: number, title: string) => Promise<void>;
};

function LibraryPanel({
  items,
  isLoading,
  errorText,
  isCreatingPlaylist,
  createPlaylistError,
  deletingPlaylistId,
  renamingPlaylistId,
  renamePlaylistError,
  onItemClick,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
}: LibraryPanelProps) {
  const [typeFilter, setTypeFilter] = useState<LibraryTypeFilter>('All');
  const [query, setQuery] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [localCreateError, setLocalCreateError] = useState('');
  const [openMenuPlaylistId, setOpenMenuPlaylistId] = useState<number | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<number | null>(null);
  const [editingPlaylistTitle, setEditingPlaylistTitle] = useState('');
  const [localRenameError, setLocalRenameError] = useState('');

  useEffect(() => {
    if (openMenuPlaylistId === null) {
      return;
    }

    const closeMenuOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.libraryItemActions')) {
        return;
      }

      setOpenMenuPlaylistId(null);
      setEditingPlaylistId(null);
      setLocalRenameError('');
    };

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuPlaylistId(null);
        setEditingPlaylistId(null);
        setLocalRenameError('');
      }
    };

    document.addEventListener('pointerdown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [openMenuPlaylistId]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      if (!matchesType) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${item.name} ${item.author} ${item.type}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, query, typeFilter]);

  const hasItems = filteredItems.length > 0;

  const submitCreatePlaylist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = playlistTitle.trim();
    if (!title) {
      setLocalCreateError('Введите название плейлиста');
      return;
    }

    setLocalCreateError('');
    try {
      await onCreatePlaylist(title);
    } catch {
      return;
    }

    setPlaylistTitle('');
    setIsCreateFormOpen(false);
    setTypeFilter('Playlist');
    setQuery('');
  };

  const visibleCreateError = localCreateError || createPlaylistError;
  const visibleRenameError = localRenameError || renamePlaylistError;

  const deletePlaylist = async (item: SearchItem) => {
    const shouldDelete = window.confirm(`Удалить плейлист "${item.name}"?`);
    if (!shouldDelete) {
      return;
    }

    setOpenMenuPlaylistId(null);
    await onDeletePlaylist(item.id);
  };

  const startRenamePlaylist = (item: SearchItem) => {
    setEditingPlaylistId(item.id);
    setEditingPlaylistTitle(item.name);
    setLocalRenameError('');
  };

  const submitRenamePlaylist = async (event: FormEvent<HTMLFormElement>, item: SearchItem) => {
    event.preventDefault();

    const title = editingPlaylistTitle.trim();
    if (!title) {
      setLocalRenameError('Введите название плейлиста');
      return;
    }

    setLocalRenameError('');
    try {
      await onRenamePlaylist(item.id, title);
    } catch {
      return;
    }

    setEditingPlaylistId(null);
    setOpenMenuPlaylistId(null);
    setEditingPlaylistTitle('');
  };

  return (
    <aside className="libraryPanel">
      <div className="libraryHeader">
        <h2 className="libraryTitle">Моя библиотека</h2>
        <button
          type="button"
          className="libraryCreateButton"
          onClick={() => {
            setIsCreateFormOpen((isOpen) => !isOpen);
            setLocalCreateError('');
          }}
          aria-expanded={isCreateFormOpen}
        >
          <span className="libraryCreatePlus" aria-hidden="true">
            +
          </span>
          Создать
        </button>
      </div>

      {isCreateFormOpen ? (
        <form className="libraryCreateForm" onSubmit={submitCreatePlaylist}>
          <input
            className="libraryCreateInput"
            value={playlistTitle}
            onChange={(event) => {
              setPlaylistTitle(event.target.value);
              setLocalCreateError('');
            }}
            placeholder="Название плейлиста"
            autoComplete="off"
            disabled={isCreatingPlaylist}
            autoFocus
          />
          <div className="libraryCreateActions">
            <button type="submit" className="libraryCreateSubmit" disabled={isCreatingPlaylist}>
              {isCreatingPlaylist ? 'Создание...' : 'Готово'}
            </button>
            <button
              type="button"
              className="libraryCreateCancel"
              onClick={() => {
                setIsCreateFormOpen(false);
                setPlaylistTitle('');
                setLocalCreateError('');
              }}
              disabled={isCreatingPlaylist}
            >
              Отмена
            </button>
          </div>
          {visibleCreateError ? <p className="libraryCreateError">{visibleCreateError}</p> : null}
        </form>
      ) : null}

      <div className="libraryTypeFilters">
        <button
          type="button"
          className={`libraryTypeFilter${typeFilter === 'All' ? ' libraryTypeFilterActive' : ''}`}
          onClick={() => setTypeFilter('All')}
        >
          Все
        </button>
        <button
          type="button"
          className={`libraryTypeFilter${typeFilter === 'Track' ? ' libraryTypeFilterActive' : ''}`}
          onClick={() => setTypeFilter('Track')}
        >
          Треки
        </button>
        <button
          type="button"
          className={`libraryTypeFilter${typeFilter === 'Album' ? ' libraryTypeFilterActive' : ''}`}
          onClick={() => setTypeFilter('Album')}
        >
          Альбомы
        </button>
        <button
          type="button"
          className={`libraryTypeFilter${typeFilter === 'Playlist' ? ' libraryTypeFilterActive' : ''}`}
          onClick={() => setTypeFilter('Playlist')}
        >
          Плейлисты
        </button>
      </div>

      <input
        className="librarySearchInput"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск по библиотеке"
        autoComplete="off"
      />

      <div className="libraryListWrap">
        {isLoading ? <p className="libraryHint">Загрузка библиотеки...</p> : null}
        {errorText ? <p className="libraryError">{errorText}</p> : null}
        {!isLoading && !errorText && !hasItems ? <p className="libraryHint">Ничего не найдено</p> : null}

        {hasItems ? (
          <ul className="libraryList">
            {filteredItems.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <div className="libraryItemRow">
                  <button type="button" className="libraryItem" onClick={() => onItemClick(item)}>
                    <span className="libraryItemCover" aria-hidden="true">
                      {item.cover ? <img src={item.cover} alt="" /> : null}
                    </span>
                    <span className="libraryItemMeta">
                      <span className="libraryItemName">{item.name}</span>
                      <span className="libraryItemDesc">
                        <span className="libraryItemType">{item.type}</span>
                        <span className="libraryItemDot"> • </span>
                        <span className="libraryItemAuthor">{item.author}</span>
                      </span>
                    </span>
                  </button>
                  {item.type === 'Playlist' ? (
                    <div className="libraryItemActions">
                      <button
                        type="button"
                        className="libraryItemMenuButton"
                        onClick={() => {
                          setOpenMenuPlaylistId((currentId) => (currentId === item.id ? null : item.id));
                          setEditingPlaylistId(null);
                          setLocalRenameError('');
                        }}
                        aria-label={`Действия с плейлистом ${item.name}`}
                        aria-expanded={openMenuPlaylistId === item.id}
                      >
                        ...
                      </button>
                      {openMenuPlaylistId === item.id ? (
                        <div className="libraryItemMenu">
                          {editingPlaylistId === item.id ? (
                            <form className="libraryRenameForm" onSubmit={(event) => void submitRenamePlaylist(event, item)}>
                              <input
                                className="libraryRenameInput"
                                value={editingPlaylistTitle}
                                onChange={(event) => {
                                  setEditingPlaylistTitle(event.target.value);
                                  setLocalRenameError('');
                                }}
                                disabled={renamingPlaylistId !== null}
                                autoComplete="off"
                                autoFocus
                              />
                              <div className="libraryRenameActions">
                                <button
                                  type="submit"
                                  className="libraryRenameSubmit"
                                  disabled={renamingPlaylistId !== null}
                                >
                                  {renamingPlaylistId === item.id ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                  type="button"
                                  className="libraryRenameCancel"
                                  onClick={() => {
                                    setEditingPlaylistId(null);
                                    setLocalRenameError('');
                                  }}
                                  disabled={renamingPlaylistId !== null}
                                >
                                  Отмена
                                </button>
                              </div>
                              {visibleRenameError ? <p className="libraryRenameError">{visibleRenameError}</p> : null}
                            </form>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="libraryItemMenuOption"
                                onClick={() => startRenamePlaylist(item)}
                                disabled={deletingPlaylistId !== null || renamingPlaylistId !== null}
                              >
                                Переименовать
                              </button>
                              <button
                                type="button"
                                className="libraryItemDeleteButton"
                                onClick={() => void deletePlaylist(item)}
                                disabled={deletingPlaylistId !== null || renamingPlaylistId !== null}
                              >
                                {deletingPlaylistId === item.id ? 'Удаление...' : 'Удалить'}
                              </button>
                            </>
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
      </div>
    </aside>
  );
}

export default LibraryPanel;
