import wedding1 from "@/assets/gallery-wedding-1.jpg";
import wedding2 from "@/assets/gallery-wedding-2.jpg";
import birthday1 from "@/assets/gallery-birthday-1.jpg";
import birthday2 from "@/assets/gallery-birthday-2.jpg";

const items = [
  { src: wedding1, label: "Weddings", caption: "Golden Hour Vows" },
  { src: birthday1, label: "Birthdays", caption: "Make a Wish" },
  { src: wedding2, label: "Weddings", caption: "Candlelit Reception" },
  { src: birthday2, label: "Birthdays", caption: "Celebration in Gold" },
];

export function FeaturedGallery() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-accent font-medium text-xs tracking-[0.3em] uppercase mb-4 block">
            Featured Moments
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-6xl font-bold text-foreground mb-4">
            Timeless <span className="text-gradient-gold italic">Memories</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
            From lavish weddings to intimate birthday soirées — every guest, every glance, effortlessly found.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl shadow-card hover:shadow-elevated transition-all duration-500 ${
                i % 3 === 0 ? "md:row-span-2 aspect-[3/4] md:aspect-[3/5]" : "aspect-square"
              }`}
            >
              <img
                src={item.src}
                alt={item.caption}
                loading="lazy"
                width={1024}
                height={1024}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="text-accent text-[10px] tracking-[0.25em] uppercase font-medium">
                  {item.label}
                </span>
                <h3 className="font-display text-xl md:text-2xl font-semibold text-background mt-1">
                  {item.caption}
                </h3>
              </div>
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full border border-accent/40 bg-background/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
