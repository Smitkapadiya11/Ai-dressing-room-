// The shop's rail. In a real install this comes from the owner's Collection
// screen; here it is the file the owner edits, which is deliberate — a shop
// owner should be able to change a price without redeploying anything.

export const SHOP = {
  name: "Kapadiya & Sons",
  tagline: "Surat • Est. 1968",
  branch: "Ring Road, Surat",
};

export const GARMENTS = [
  {
    id: "crimson-zardozi-lehenga",
    name: "Crimson Zardozi Lehenga",
    fabric: "Zardozi on raw silk",
    price: 48500,
    sizes: ["S", "M", "L", "XL"],
    image: "/garments/crimson-zardozi-lehenga.jpg",
    demoResult: "/looks/look-crimson.jpg",
    kind: "lehenga",
  },
  {
    id: "emerald-raw-silk",
    name: "Emerald Raw Silk",
    fabric: "Antique gold zari",
    price: 18500,
    sizes: ["S", "M", "L"],
    image: "/garments/emerald-raw-silk.jpg",
    demoResult: "/looks/look-emerald.jpg",
    kind: "lehenga",
  },
  {
    id: "midnight-velvet",
    name: "Imperial Midnight Velvet",
    fabric: "Silver zardozi on silk velvet",
    price: 62000,
    sizes: ["M", "L", "XL"],
    image: "/garments/midnight-velvet.jpg",
    demoResult: "/looks/look-midnight.jpg",
    kind: "lehenga",
  },
  {
    id: "ivory-banarasi-saree",
    name: "Ivory Banarasi Saree",
    fabric: "Rose gold brocade",
    price: 12400,
    sizes: ["Free"],
    image: "/garments/ivory-banarasi-saree.jpg",
    demoResult: "/looks/look-ivory.jpg",
    kind: "saree",
  },
];

export const byId = (id) => GARMENTS.find((g) => g.id === id);

export const inr = (n) => "₹" + n.toLocaleString("en-IN");
