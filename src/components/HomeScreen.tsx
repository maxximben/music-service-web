import type { SearchItem } from '../types/search';
import './HomeScreen.css';

type HomeScreenProps = {
  query: string;
  isDropdownOpen: boolean;
  isLoading: boolean;
  errorText: string;
  items: SearchItem[];
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onTrackClick: (item: SearchItem) => void;
};

function HomeScreen({
  query,
  isDropdownOpen,
  isLoading,
  errorText,
  items,
  onQueryChange,
  onFocus,
  onBlur,
  onTrackClick,
}: HomeScreenProps) {
  const isHistoryMode = query.trim().length === 0;
  const visibleItems = isHistoryMode ? items.slice(0, 8) : items;
  const hasItems = visibleItems.length > 0;
  const showEmpty = !isLoading && !hasItems && !isHistoryMode;
  const showHistoryHint = isHistoryMode && hasItems;

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
              placeholder="Что хочешь включить?"
              autoComplete="off"
            />
          </div>

          {isDropdownOpen ? (
            <div className="searchDropdown">
              {isLoading ? <p className="searchHint">Поиск...</p> : null}
              {errorText ? <p className="searchError">{errorText}</p> : null}

              {hasItems ? (
                <ul className="searchList">
                  {visibleItems.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        className="searchItem"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onTrackClick(item)}
                      >
                        <span className="searchItemCover" aria-hidden="true">
                          {item.cover ? <img src={item.cover} alt="" /> : null}
                        </span>
                        <span className="searchItemMeta">
                          <span className="searchItemName">{item.name}</span>
                          <span className="searchItemAuthor">{item.author}</span>
                        </span>
                        <span className="searchItemType">{item.type}</span>
                      </button>
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
    </div>
  );
}

export default HomeScreen;
