/* =========================================================
   BAKERY ABCs — CONTENT FILE
   Edit everything here: business info, categories, and products.
   Nothing in index.html, style.css, or script.js needs to
   change when you update your menu — just edit this file.
   ========================================================= */

const BUSINESS_INFO = {
  name: "Bakery ABCs",
  tagline: "Freshly Baked, Every Day",
  currencySymbol: "RM",
  contactNote: "We'll contact you at the number you provide to confirm your order.",
  // Simple order-type options offered at checkout
  orderTypes: ["Self Pick-up", "Delivery"],
  paymentMethods: ["Cash on Pick-up / Delivery", "Bank Transfer", "Online Payment (E-wallet)"]
};

// Category display order. Product "category" fields below must match one of these exactly.
const CATEGORIES = ["Breads", "Pastries", "Cakes", "Beverages"];

/*
  Each product:
  - id: unique number, never reuse/change once orders exist
  - category: must match a value in CATEGORIES
  - name, description, price (in the currency above)
  - image: path to a product photo. Put real photos in the /images folder
           using these exact filenames and they'll appear automatically.
           Until then, a neat icon placeholder is shown instead.
  - icon: emoji shown as a placeholder when the image file isn't found yet
*/
const PRODUCTS = [
  // --- Breads ---
  {
    id: 1,
    category: "Breads",
    name: "Classic Sourdough Loaf",
    description: "Naturally leavened, crisp crust, soft open crumb.",
    price: 14.90,
    image: "images/Classic.jpg",
    icon: "🍞"
  },
  {
    id: 2,
    category: "Breads",
    name: "Milk Butter Loaf",
    description: "Soft, slightly sweet white loaf, great for sandwiches.",
    price: 9.50,
    image: "images/Milk_Butter.jpg",
    icon: "🍞"
  },
  {
    id: 3,
    category: "Breads",
    name: "Wholemeal Multigrain",
    description: "Hearty multigrain loaf with oats and seeds.",
    price: 11.90,
    image: "images/Wholemeal Multigrain.jpg",
    icon: "🌾"
  },

  // --- Pastries ---
  {
    id: 4,
    category: "Pastries",
    name: "Butter Croissant",
    description: "Flaky, buttery, laminated French classic.",
    price: 6.50,
    image: "images/butter-croissant.jpg",
    icon: "🥐"
  },
  {
    id: 5,
    category: "Pastries",
    name: "Chocolate Danish",
    description: "Buttery pastry swirled with rich dark chocolate.",
    price: 7.20,
    image: "images/chocolate-danish.jpg",
    icon: "🥐"
  },
  {
    id: 6,
    category: "Pastries",
    name: "Almond Croissant",
    description: "Twice-baked croissant filled with almond cream.",
    price: 8.00,
    image: "images/almond-croissant.jpg",
    icon: "🥐"
  },

  // --- Cakes ---
  {
    id: 7,
    category: "Cakes",
    name: "Chocolate Fudge Slice",
    description: "Dense, rich chocolate cake with fudge frosting.",
    price: 12.00,
    image: "images/chocolate-fudge-slice.jpg",
    icon: "🍰"
  },
  {
    id: 8,
    category: "Cakes",
    name: "Classic Cheesecake Slice",
    description: "Creamy baked cheesecake on a biscuit base.",
    price: 13.50,
    image: "images/cheesecake-slice.jpg",
    icon: "🍰"
  },
  {
    id: 9,
    category: "Cakes",
    name: "Red Velvet Cupcake",
    description: "Moist red velvet topped with cream cheese frosting.",
    price: 6.90,
    image: "images/red-velvet-cupcake.jpg",
    icon: "🧁"
  },

  // --- Beverages ---
  {
    id: 10,
    category: "Beverages",
    name: "Iced White Coffee",
    description: "Ipoh-style white coffee, served over ice.",
    price: 6.00,
    image: "images/iced-white-coffee.jpg",
    icon: "🥤"
  },
  {
    id: 11,
    category: "Beverages",
    name: "Homemade Lemonade",
    description: "Refreshing lemonade made fresh daily.",
    price: 5.50,
    image: "images/lemonade.jpg",
    icon: "🥤"
  },
  {
    id: 12,
    category: "Beverages",
    name: "Hot Chamomile Tea",
    description: "Soothing chamomile tea, served hot.",
    price: 4.50,
    image: "images/chamomile-tea.jpg",
    icon: "🍵"
  }
];

// Order status flow — used by both the customer tracking view and,
// later, the staff management page.
const ORDER_STATUSES = ["NEW", "PREPARING", "READY", "COMPLETED"];
