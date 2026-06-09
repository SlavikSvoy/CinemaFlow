import "../index.css";

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-text">
          <p className="scanner-label">CinemaFlow</p>
          <h1>Про наш кінотеатр</h1>
          <p>
            CinemaFlow — це сучасний вебзастосунок для автоматизації роботи
            кінотеатру, який дозволяє відвідувачам швидко переглядати афішу,
            обирати сеанси, бронювати місця та отримувати електронні квитки з
            QR-кодами.
          </p>
        </div>

        <div className="about-hero-card">
          <h3>🎬 CinemaFlow</h3>
          <p>
            Зручне онлайн-бронювання квитків, автоматизований контроль проходу
            до кінозалу та ефективне керування сеансами.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>Наша мета</h2>
        <p>
          Метою розробки CinemaFlow є підвищення ефективності роботи кінотеатру
          за рахунок автоматизації основних процесів: перегляду афіші,
          бронювання місць, формування електронних квитків та перевірки QR-кодів
          контролерами. Такий підхід дозволяє зменшити навантаження на персонал,
          скоротити час обслуговування відвідувачів і зробити процес придбання
          квитків більш зручним.
        </p>
      </section>

      <section className="about-grid">
        <div className="about-card">
          <div className="about-icon">🎟</div>
          <h3>Онлайн-бронювання</h3>
          <p>
            Користувач може самостійно обрати фільм, сеанс і місце у кінозалі
            без необхідності звертатися до каси.
          </p>
        </div>

        <div className="about-card">
          <div className="about-icon">💺</div>
          <h3>Вибір місць</h3>
          <p>
            Система відображає схему залу, зайняті та вільні місця, що дозволяє
            уникнути дублювання бронювань.
          </p>
        </div>

        <div className="about-card">
          <div className="about-icon">▦</div>
          <h3>QR-квитки</h3>
          <p>
            Після бронювання формується електронний квиток із QR-кодом, який
            використовується для проходу до кінозалу.
          </p>
        </div>

        <div className="about-card">
          <div className="about-icon">🛡</div>
          <h3>Контроль доступу</h3>
          <p>
            Контролер може сканувати QR-квитки та бачити актуальну інформацію
            про сеанс, місце і заповненість залу.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>Переваги системи</h2>

        <div className="about-list">
          <div>
            <strong>01</strong>
            <p>Швидке бронювання квитків без обов’язкової реєстрації.</p>
          </div>

          <div>
            <strong>02</strong>
            <p>Автоматична генерація електронного квитка з QR-кодом.</p>
          </div>

          <div>
            <strong>03</strong>
            <p>
              Зручна адміністративна панель для керування фільмами та сеансами.
            </p>
          </div>

          <div>
            <strong>04</strong>
            <p>Службовий доступ для контролера квитків і адміністратора.</p>
          </div>
        </div>
      </section>

      <section className="about-contact">
        <h2>Контактна інформація</h2>
        <p>📞 +380 00 000 00 00</p>
        <p>✉ info@cinemaflow.com</p>
        <p>📍 м. Вінниця, вул. Кінотеатрна, 1</p>
      </section>
    </main>
  );
}
