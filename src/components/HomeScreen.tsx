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
  const hasItems = items.length > 0;
  const showEmpty = !isLoading && !hasItems && query.trim().length > 0;

  return (
    <div className="homePage">
      <div className="searchShell" onBlur={onBlur}>
        <input
          className="searchInput"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          placeholder="Поиск треков"
          autoComplete="off"
        />

        {isDropdownOpen ? (
          <div className="searchDropdown">
            {isLoading ? <p className="searchHint">Поиск...</p> : null}
            {errorText ? <p className="searchError">{errorText}</p> : null}

            {hasItems ? (
              <ul className="searchList">
                {items.map((item) => (
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

            {showEmpty ? <p className="searchHint">Ничего не найдено</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default HomeScreen;
