import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

function Journal() {
  const navigate = useNavigate();

  const articles = [
    {
      id: 1,
      category: "DESIGN",
      date: "August 18, 2026",
      title: "The Art of Everyday Objects",
      excerpt:
        "A closer look at how thoughtful forms, quiet materials and subtle details can reshape the feeling of a space.",
      image: "/journal/journal-01.jpg",
    },
    {
      id: 2,
      category: "MATERIALS",
      date: "August 10, 2026",
      title: "The Quiet Luxury of Material",
      excerpt:
        "Exploring texture, weight and natural finishes through the objects we choose to live with every day.",
      image: "/journal/journal-02.jpg",
    },
    {
      id: 3,
      category: "STUDIO",
      date: "July 29, 2026",
      title: "Designing With Intention",
      excerpt:
        "Why restraint, proportion and purpose matter more than decoration when creating objects meant to last.",
      image: "/journal/journal-03.jpg",
    },
    {
      id: 4,
      category: "LIVING",
      date: "July 17, 2026",
      title: "Objects That Last",
      excerpt:
        "A slower approach to consumption, built around pieces that become more meaningful through continued use.",
      image: "/journal/journal-04.jpg",
    },
  ];

  return (
    <main className="journal-page">
      <div className="container">
        <motion.header
          className="journal-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <p className="section-eyebrow">AUREN / JOURNAL</p>

          <h1>
            Stories of
            <span>form and living.</span>
          </h1>

          <p>
            Notes on objects, materials and the quieter rituals that shape
            everyday life.
          </p>
        </motion.header>

        <section className="journal-grid">
          {articles.map((article, index) => (
            <motion.article
              className="journal-card"
              key={article.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <button
                className="journal-card-image"
                onClick={() => navigate(`/journal/${article.id}`)}
                aria-label={`Read ${article.title}`}
              >
                <img src={article.image} alt={article.title} />
              </button>

              <div className="journal-card-meta">
                <span>{article.category}</span>
                <span>{article.date}</span>
              </div>

              <h2>{article.title}</h2>

              <p>{article.excerpt}</p>

              <button
                className="journal-read-link"
                onClick={() => navigate(`/journal/${article.id}`)}
              >
                Read article
                <span>↗</span>
              </button>
            </motion.article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default Journal;



