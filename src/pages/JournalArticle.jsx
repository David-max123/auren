import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";

function JournalArticle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const articles = [
    {
      id: 1,
      category: "DESIGN",
      date: "August 18, 2026",
      title: "The Art of Everyday Objects",
      image: "/journal/journal-01.jpg",
      intro:
        "The objects around us quietly shape the way we experience everyday life. At Auren, we believe the most meaningful pieces are often the simplest ones.",
      paragraphs: [
        "Good design does not always ask for attention. Sometimes its greatest strength is the way it quietly becomes part of our routines.",
        "A chair, a vessel, a lamp or a small object on a shelf can change the atmosphere of a room without demanding to be noticed. Proportion, material and texture work together to create a sense of balance.",
        "We design objects with this idea in mind: that everyday things deserve the same consideration as everything else. The result is a collection built around restraint, purpose and lasting character.",
      ],
    },
    {
      id: 2,
      category: "MATERIALS",
      date: "August 10, 2026",
      title: "The Quiet Luxury of Material",
      image: "/journal/journal-02.jpg",
      intro:
        "Luxury does not always need to be obvious. Sometimes it can be found in the weight of an object, the texture of a surface or the warmth of a natural material.",
      paragraphs: [
        "Material has a language of its own. Wood, stone, metal and fabric each introduce a different feeling into the spaces we inhabit.",
        "We are drawn to materials that become more interesting with time. Small marks, changes in texture and natural variation give an object a sense of history and individuality.",
        "For us, quiet luxury is about choosing fewer things and choosing them carefully. It is about creating pieces that feel considered rather than excessive.",
      ],
    },
    {
      id: 3,
      category: "STUDIO",
      date: "July 29, 2026",
      title: "Designing With Intention",
      image: "/journal/journal-03.jpg",
      intro:
        "Every detail has a reason. From the proportions of a silhouette to the way an object feels in the hand, intention sits at the centre of our design process.",
      paragraphs: [
        "The process often begins with subtraction. What can be removed without compromising function? What can be simplified without losing personality?",
        "This way of thinking helps us create objects that feel natural to use. The goal is not to make something complicated, but to make something feel inevitable.",
        "The final form may appear simple, but simplicity is often the result of many decisions. Every curve, edge and surface has been considered.",
      ],
    },
    {
      id: 4,
      category: "LIVING",
      date: "July 17, 2026",
      title: "Objects That Last",
      image: "/journal/journal-04.jpg",
      intro:
        "We live surrounded by objects. The ones that remain meaningful are rarely the ones we replace quickly; they are the ones that become part of our lives.",
      paragraphs: [
        "A considered object earns its place over time. It becomes familiar through repeated use and begins to carry memories of the routines around it.",
        "This is why longevity matters to our approach. We want Auren pieces to feel relevant beyond a particular season or trend.",
        "Designing for permanence means creating forms that can live comfortably across different spaces, different homes and different chapters of life.",
      ],
    },
  ];

  const article = articles.find((item) => item.id === Number(id));

  if (!article) {
    return (
      <main className="journal-article-page">
        <div className="container journal-article-not-found">
          <p className="section-eyebrow">AUREN / 404</p>

          <h1>Article not found.</h1>

          <button onClick={() => navigate("/journal")}>
            Back to Journal
            <span>↗</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="journal-article-page">
      <div className="container">
        {/* Back */}
        <motion.button
          className="journal-article-back"
          onClick={() => navigate("/journal")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          ← Back to Journal
        </motion.button>

        {/* Header */}
        <motion.header
          className="journal-article-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="journal-article-meta">
            <span>{article.category}</span>
            <span>{article.date}</span>
          </div>

          <h1>{article.title}</h1>

          <p>{article.intro}</p>
        </motion.header>

        {/* Hero Image */}
        <motion.div
          className="journal-article-image"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <img src={article.image} alt={article.title} />
        </motion.div>

        {/* Article Content */}
        <motion.article
          className="journal-article-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.25,
          }}
        >
          {article.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </motion.article>

        {/* Footer */}
        <div className="journal-article-footer">
          <span>AUREN / JOURNAL</span> <br></br>

          <button onClick={() => navigate("/journal")}>
            More stories
            <span>↗</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default JournalArticle;



