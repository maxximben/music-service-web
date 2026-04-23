type LandingScreenProps = {
  onSignUp: () => void;
  onSignIn: () => void;
};

function LandingScreen({ onSignUp, onSignIn }: LandingScreenProps) {
  return (
    <div className="landing">
      <img className="logoIcon" src="./src/assets/music.png" alt="Music Service" />
      <div className="landingActions">
        <button className="primaryButton" type="button" onClick={onSignUp}>
          Зарегистрироваться
        </button>
        <button className="ghostButton" type="button" onClick={onSignIn}>
          У меня уже есть аккаунт
        </button>
      </div>
    </div>
  );
}

export default LandingScreen;
