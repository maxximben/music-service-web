import { useMemo, useState } from 'react';
import type { SearchItem } from '../types/search';
import './LibraryPanel.css';

type LibraryTypeFilter = 'All' | 'Track' | 'Album' | 'Playlist';

type LibraryPanelProps = {
  items: SearchItem[];
  isLoading: boolean;
  errorText: string;
  onItemClick: (item: SearchItem) => void;
};

function LibraryPanel({ items, isLoading, errorText, onItemClick }: LibraryPanelProps) {
  const [typeFilter, setTypeFilter] = useState<LibraryTypeFilter>('All');
  const [query, setQuery] = useState('');

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

  return (
    <aside className="libraryPanel">
      <div className="libraryHeader">
        <h2 className="libraryTitle">Моя библиотека</h2>
        <button type="button" className="libraryCreateButton">
          <span className="libraryCreatePlus" aria-hidden="true">
            +
          </span>
          Создать
        </button>
      </div>

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
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}

export default LibraryPanel;
