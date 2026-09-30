import './Craft.css';

export default function Craft() {
  return (
    <div className="craft-page">
      {/* 1. Hero Section */}
      <section className="craft-hero">
        <div className="container">
          <h1 className="section-title">THE CRAFT</h1>
          <p className="hero-subtitle">A journey of skill, patience, and unwavering artistry.</p>
        </div>
      </section>

      {/* 2. Introduction */}
      <section className="craft-intro container">
        <div className="intro-text">
          <span className="overline">— LUCKNOW'S HERITAGE —</span>
          <h2>BORN IN THE CITY OF NAWABS</h2>
          <p>The art of Chikankari is a centuries-old tradition, originating in the royal courts of Awadh. At Safed Rang, we preserve this delicate hand-embroidery technique, combining it with the opulent grandeur of Zardozi to create modern heirlooms.</p>
          <p>Every piece is a labor of love, requiring hundreds of hours of meticulous handwork by master artisans. From the initial block printing to the final pearl embellishment, our process is entirely untouched by machines.</p>
        </div>
      </section>

      {/* 3. The Process Steps */}
      <section className="craft-process container">
        
        {/* Step 1: Chhapai */}
        <div className="process-step right">
          <div className="step-image">
            <img src="/chhapai.jpg" alt="Chhapai Block Printing" />
          </div>
          <div className="step-content">
            <span className="step-number">01</span>
            <h3>CHHAPAI (Block Printing)</h3>
            <p>The journey of a Safed Rang masterpiece begins with Chhapai. Using carved wooden blocks and washable indigo dyes, the intricate design is meticulously stamped onto the pristine fabric.</p>
            <p>This printed pattern serves as the blueprint for our artisans. It requires a steady hand and a perfect understanding of symmetry to ensure the final embroidery flows flawlessly across the garment.</p>
          </div>
        </div>

        {/* Step 2: Chikankari */}
        <div className="process-step left">
          <div className="step-content">
            <span className="step-number">02</span>
            <h3>CHIKANKARI (Hand Embroidery)</h3>
            <p>Once the fabric is printed, it is handed over to our master embroiderers. Chikankari is an art of patience. Using needle and thread, the artisans bring the floral and paisley motifs to life using over 32 traditional stitches, including Tepchi, Bakhiya, Hool, and Murri.</p>
            <p>Depending on the density of the design, a single saree or kurta set can take anywhere from three months to over a year to embroider. The artisans pull the thread with just the right tension to avoid puckering the delicate fabric, a skill passed down through generations.</p>
          </div>
          <div className="step-image">
            <img src="/chikankari.jpg" alt="Chikankari Hand Embroidery" />
          </div>
        </div>

        {/* Step 3: Washing (Dhulai) */}
        <div className="process-step right">
          <div className="step-image">
            <img src="/woman_chikankari_saree.jpg" alt="Dhulai Washing Process" />
          </div>
          <div className="step-content">
            <span className="step-number">03</span>
            <h3>DHULAI (Washing & Finishing)</h3>
            <p>After the embroidery is complete, the fabric undergoes a rigorous, traditional washing process called Dhulai. This crucial step removes all traces of the indigo blue Chhapai ink, revealing the pure, brilliant white embroidery against the base fabric.</p>
            <p>The fabric is then carefully starched and ironed, restoring its crispness and preparing it for the final, most luxurious stage of its creation.</p>
          </div>
        </div>

        {/* Step 4: Zardozi & Embellishment */}
        <div className="process-step left">
          <div className="step-content">
            <span className="step-number">04</span>
            <h3>ZARDOZI & EMBELLISHMENT</h3>
            <p>For our premium One-of-One edit and bridal pieces, the embroidered fabric travels to the Zardozi karkhanas. Here, the fabric is stretched tightly over a wooden frame (adda).</p>
            <p>Artisans use a specialized curved needle to weave metallic gold and silver threads (Zari), tiny pearls (Moti), sequins, and cut-dana into the fabric. This regal embellishment adds a breathtaking layer of dimension and luxury, transforming the garment into a true masterpiece of Indian couture.</p>
          </div>
          <div className="step-image">
            <img src="/embellishment.jpg" alt="Zardozi Embellishment" />
          </div>
        </div>

      </section>

      {/* 4. Conclusion */}
      <section className="craft-conclusion bg-dark">
        <div className="container text-center">
          <h2>WEAR A PIECE OF HISTORY</h2>
          <p>When you wear Safed Rang, you carry the legacy of Lucknow and the dedication of countless artisans.</p>
        </div>
      </section>
    </div>
  );
}
