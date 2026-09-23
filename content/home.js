// All copy for the home page. Edit words here, not in components.
// Anything in {{ }} is a placeholder, listed in docs/CONTENT_TODO.md.

export const contact = {
  // Leave empty to hide. WhatsApp number in international format, digits only.
  whatsapp: "",
  email: "",
  city: "Surat, Gujarat",
};

export const hero = {
  eyebrow: "Kapadiya & Sons · Surat",
  title: ["Every saree in the shop,", "on your customer.", "No packet opened."],
  sub: "A smart mirror and the software behind it, made for clothing shops and showrooms. Customers stand in front of it, pick from your catalogue and see the garment on their own body in seconds. Trial rooms stay free and they see more of your stock.",
  primary: { label: "Try it on yourself", href: "/mirror" },
  secondary: { label: "Book a demo in your shop", href: "#contact" },
};

export const problem = {
  eyebrow: "On the shop floor",
  title: "The sale is lost somewhere between the shelf and the trial room.",
  items: [
    {
      k: "01",
      title: "Fifteen sarees unfolded. One bought.",
      body: "Nobody can drape fifteen sarees. Staff unfold, refold and re-pin, and packets come back creased or torn.",
    },
    {
      k: "02",
      title: "The queue on a Sunday in Navratri.",
      body: "Weekends and festival season fill the trial rooms. Customers who wait too long walk out, and the next shop gets them.",
    },
    {
      k: "03",
      title: "“I’ll think about it.”",
      body: "When a customer can't picture it on themselves, they go home and don't come back.",
    },
    {
      k: "04",
      title: "The catalogue is bigger than the shelf.",
      body: "You stock hundreds of designs. A customer sees the few that are on display that day.",
    },
  ],
};

export const origin = {
  eyebrow: "Where the idea came from",
  title: "It already works in China. Nobody had built it for us.",
  steps: [
    {
      when: "{{DATE}}",
      title: "A mirror in a Chinese clothing shop",
      body: "A touchscreen and a 4K camera. A few seconds of scanning, and the customer sees the clothes on themselves.",
    },
    {
      when: "{{DATE}}",
      title: "Nothing like it here",
      body: "Nothing was built for Surat's textile markets, for sarees, or for shops that can't spend lakhs on hardware.",
    },
    {
      when: "2026",
      title: "So he built it",
      body: "Software first, working on an ordinary touch display and camera, tuned for Indian ethnic wear.",
    },
  ],
};

export const founder = {
  eyebrow: "Who builds it",
  name: "Smit Kapadiya",
  portrait: "/media/founder.jpg", // placeholder until supplied
  intro: "I grew up around Surat's cloth trade. I studied computer science. Then I spent a year selling, and learned how a business actually decides to buy. Kapadiya & Sons is where those three meet.",
  milestones: [
    { when: "2022 – 2025", title: "BCA / B.Sc Computer Science, CHARUSAT", body: "Learned to build software properly." },
    { when: "2025", title: "IT Bench Sales Recruiter, Radiance Technologies, Ahmedabad", body: "Learned how businesses buy, and how to talk to them." },
    { when: "Jan 2026", title: "Started Kapadiya & Sons in Surat", body: "An AI generalist building working automation for real businesses." },
    { when: "Sep 2026", title: "The mirror", body: "Researched the market, costed the hardware, built the kiosk software and demoed it to investors on their own screen." },
  ],
};

export const steps = {
  eyebrow: "How it works",
  title: "Three steps. About as long as it takes to unfold one saree.",
  items: [
    { n: "1", title: "Stand in front of the mirror.", body: "The camera takes your picture in a few seconds." },
    { n: "2", title: "Pick from the catalogue.", body: "Swipe through the shop's own garments: sarees, lehengas, kurtas, shirts." },
    { n: "3", title: "See it on you.", body: "Your body, your skin, your shape, wearing that garment. Scan the QR and the look goes home on your phone.", honest: true },
  ],
};

export const features = {
  eyebrow: "For the shop",
  title: "Built for the owner as much as the customer.",
  live: [
    { title: "Your own catalogue", body: "Photograph your garments and they appear on the mirror. Your stock, not a stock library." },
    { title: "Instant try-on", body: "A few seconds from tap to result, right at the mirror." },
    { title: "The look goes home", body: "A QR code puts the result on the customer's phone, which gives them a reason to come back." },
    { title: "Floor or wall", body: "Runs on a floor-standing kiosk or a wall-mounted portrait screen." },
    { title: "Attract mode", body: "When nobody is using it, the mirror plays your shop's looks on a loop." },
  ],
  soon: ["Size guidance", "Which garments get tried most", "Gujarati and Hindi interface", "Consent and privacy controls under the DPDP Act"],
};

export const honesty = {
  eyebrow: "Our promise",
  title: ["It shows you.", "Not a better-looking you."],
  points: [
    "We don't slim you, reshape you, lighten your skin or add makeup.",
    "The garment is fitted to your body, in your size, and falls the way it would on you.",
    "Customers buy with confidence, fewer purchases disappoint, and the shop earns trust.",
  ],
  caption: "Same face. Same body. Same skin. New outfit.",
};

export const system = {
  eyebrow: "Why it works now",
  title: "Four parts that only recently became good enough to put together.",
  body: "A touch display. A camera. A generative image model that understands fabric, drape and print. And a catalogue built around Indian ethnic wear. The try-on engine can run on a cloud service, or on our own GPU server for high-volume shops.",
  nodes: ["Camera", "Mirror software", "Try-on engine", "Result + QR"],
};

export const reasons = {
  eyebrow: "Why shops buy it",
  title: "Six reasons it earns its place on the shop floor.",
  items: [
    { title: "More garments seen per customer.", body: "Customers browse the whole range without a single packet being unpacked." },
    { title: "Shorter trial-room queues.", body: "Most of the deciding happens at the mirror, not behind a curtain." },
    { title: "A reason to come back.", body: "The look leaves on the customer's phone, with your shop's name on it." },
    { title: "Something the shop next door doesn't have.", body: "People talk about it, and they bring friends to try it." },
    { title: "No big upfront cost.", body: "A monthly plan, with hardware on rent if you want it." },
    { title: "Local support.", body: "Set up and supported from Surat. Call us and we pick up." },
  ],
};

export const faq = {
  eyebrow: "Questions",
  items: [
    { q: "Does it work for sarees and lehengas?", a: "Yes. They are what it was built for. The engine is told how a saree drapes (pleats at the front, pallu over the left shoulder, an unbroken border) and it keeps the zari and embroidery at the correct scale." },
    { q: "Does it change how I look?", a: "No. Only the clothing changes. It doesn't slim you, lighten your skin, smooth your face or add makeup. If a result ever does, that's a bug and we want to see it." },
    { q: "What hardware do I need?", a: "A portrait touch display, a camera and an internet connection. We can supply all of it on rent. {{TBD: exact spec sheet}}" },
    { q: "How long does setup take?", a: "{{TBD}}" },
    { q: "Is customer data stored?", a: "The camera photo is used to make the try-on and is not saved. The finished try-on is held for 15 minutes so the customer can scan it to their phone. After that, the link stops working." },
    { q: "Can I use my own catalogue photos?", a: "Yes. That's the point. A clear, well-lit photo of each garment is enough to start." },
    { q: "What if the internet goes down?", a: "The try-on needs a connection to generate the result. The mirror keeps running its attract loop and starts try-ons again once the connection returns. {{TBD: offline plan for large stores}}" },
    { q: "How do I pay?", a: "Monthly. {{TBD: payment methods and billing terms}}" },
  ],
};

export const closing = {
  title: ["Let them see it on themselves.", "Then let them decide."],
  cta: { label: "Book a demo in your shop", href: "#contact" },
  signoff: "Silk is patient. So is a tailor.",
  credit: "Designed & built by Smit Kapadiya",
};
