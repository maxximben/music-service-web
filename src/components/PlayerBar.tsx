import type { ReactNode } from 'react';
import './PlayerBar.css';
import nextIcon from '../assets/next.png';
import pauseIcon from '../assets/pause.png';
import playIcon from '../assets/play.png';
import previousIcon from '../assets/previous.png';
import repeatIcon from '../assets/repeat.png';
import shuffleIcon from '../assets/shuffle.png';

type IconButtonProps = {
  label: string;
  children: ReactNode;
  isPrimary?: boolean;
  onClick?: () => void;
};

type PlayerBarProps = {
  isPlaying: boolean;
  trackTitle: string;
  trackArtist: string;
  trackCover: string | null;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (nextTime: number) => void;
};

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }

  const rounded = Math.floor(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function IconButton({ label, children, isPrimary = false, onClick }: IconButtonProps) {
  return (
    <button
      className={isPrimary ? 'playerControl playerControlPrimary' : 'playerControl'}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PlayerBar({
  isPlaying,
  trackTitle,
  trackArtist,
  trackCover,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
}: PlayerBarProps) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
  const seekValue = safeDuration > 0 ? Math.min(safeCurrentTime, safeDuration) : 0;
  const progressPercent = safeDuration > 0 ? (seekValue / safeDuration) * 100 : 0;

  return (
    <footer className="playerBar">
      <div className="playerTopRow">
        <div className="playerNowPlaying">
          <div className="playerCoverPlaceholder" aria-hidden="true">
            {trackCover ? <img src={trackCover} alt="" /> : null}
          </div>
          <div className="playerTrackMeta">
            <p className="playerTrackTitle">{trackTitle}</p>
            <p className="playerTrackArtist">{trackArtist}</p>
          </div>
        </div>

        <div className="playerControls">
          <IconButton label="Shuffle">
            <img src={shuffleIcon} alt="" />
          </IconButton>

          <IconButton label="Previous">
            <img src={previousIcon} alt="" />
          </IconButton>

          <IconButton
            label={isPlaying ? 'Pause' : 'Play'}
            isPrimary
          onClick={onTogglePlay}
          >
            <img src={isPlaying ? pauseIcon : playIcon} alt="" />
          </IconButton>

          <IconButton label="Next">
            <img src={nextIcon} alt="" />
          </IconButton>

          <IconButton label="Repeat">
            <img src={repeatIcon} alt="" />
          </IconButton>
        </div>

        <div className="playerTopSpacer" aria-hidden="true" />
      </div>

      <div className="playerProgress">
        <span className="playerTime">{formatTime(seekValue)}</span>
        <input
          className="playerSeek"
          type="range"
          min={0}
          max={safeDuration || 1}
          step={0.1}
          value={seekValue}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Прогресс воспроизведения"
          style={{
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPercent}%, rgba(255, 255, 255, 0.26) ${progressPercent}%, rgba(255, 255, 255, 0.26) 100%)`,
          }}
        />
        <span className="playerTime">{formatTime(safeDuration)}</span>
      </div>
    </footer>
  );
}

export default PlayerBar;
