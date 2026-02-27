// Mock data for Community, Learn, and other features
export const challenges = [
  {
    id: "ch1",
    title: "Zero Plastic Day",
    description: "Go 24 hours without using any single-use plastic. Challenge yourself to find alternatives for plastic bags, bottles, and packaging.",
    duration: "7 days",
    participants: 2341,
    progress: 68,
    image: "🛍️",
  },
  {
    id: "ch2",
    title: "Veg-tastic Week",
    description: "Eat vegetarian or vegan meals for the entire week. Discover that plant-based meals can be delicious and reduce your carbon footprint by up to 30%.",
    duration: "7 days",
    participants: 1856,
    progress: 45,
    image: "🥗",
  },
  {
    id: "ch3",
    title: "Energy Detective",
    description: "Find ways to reduce energy consumption in your home. Audit your appliances, optimize usage, and document your savings.",
    duration: "14 days",
    participants: 1205,
    progress: 52,
    image: "⚡",
  },
  {
    id: "ch4",
    title: "Commute Swap",
    description: "Use public transport, carpool, bike, or walk instead of driving solo. Track your alternative commutes and earn rewards.",
    duration: "7 days",
    participants: 987,
    progress: 71,
    image: "🚴",
  },
  {
    id: "ch5",
    title: "Local Love",
    description: "Buy only local produce and products for one month. Support local farmers and reduce transportation emissions.",
    duration: "30 days",
    participants: 645,
    progress: 28,
    image: "🌾",
  },
];

export const successStories = [
  {
    id: "story1",
    author: "Priya M.",
    initials: "PM",
    date: "2 days ago",
    story:
      "I switched to a steel water bottle and it's been a game-changer! Already saved 247 plastic bottles in just 2 months. Plus I'm saving money on water purchases. Highly recommend! 🌍",
    likes: 342,
    liked: false,
    image: "💧",
  },
  {
    id: "story2",
    author: "Raj Kumar",
    initials: "RK",
    date: "5 days ago",
    story:
      "Completed Zero Plastic Day challenge! Our family reduced waste by 80% and discovered amazing alternatives to packaging. Next month: going all-in for 30 days! 🎉",
    likes: 518,
    liked: false,
    image: "♻️",
  },
  {
    id: "story3",
    author: "Ananya Singh",
    initials: "AS",
    date: "1 week ago",
    story:
      "Started biking to work 3 days a week. Not only am I reducing carbon emissions (156 kg saved!), but I'm also getting fitter. Win-win! 🚴‍♀️",
    likes: 276,
    liked: false,
    image: "🚴",
  },
  {
    id: "story4",
    author: "Vikram Patel",
    initials: "VP",
    date: "1 week ago",
    story:
      "My family adopted a 'Meatless Monday' ritual. We're enjoying delicious vegetarian meals and reducing our food carbon footprint significantly. Plant power! 🌱",
    likes: 421,
    liked: false,
    image: "🥕",
  },
  {
    id: "story5",
    author: "Meera Desai",
    initials: "MD",
    date: "2 weeks ago",
    story:
      "Switched all light bulbs to LED and installed motion sensors. Electric bill dropped by 23% and the house is still perfectly lit. Small changes, big impact! 💡",
    likes: 389,
    liked: false,
    image: "💡",
  },
  {
    id: "story6",
    author: "Arjun Nair",
    initials: "AN",
    date: "2 weeks ago",
    story:
      "Participated in the Local Love challenge and discovered amazing farmers market finds! Supporting local businesses while reducing my carbon footprint. Amazing community vibe! 🌻",
    likes: 267,
    liked: false,
    image: "🌽",
  },
];

export const leaderboardMock = {
  friends: [
    { rank: 1, name: "Anit", initials: "AN", points: 1900, color: "bg-blue-500" },
    { rank: 2, name: "Mukund", initials: "MK", points: 1750, color: "bg-green-500" },
    { rank: 3, name: "Bhavroth", initials: "BH", points: 1620, color: "bg-purple-500" },
    { rank: 4, name: "Tanushi", initials: "TN", points: 1500, color: "bg-pink-500" },
    { rank: 5, name: "Tejaswini", initials: "TJ", points: 1300, color: "bg-yellow-500" },
  ],
  local: [
    { rank: 1, name: "Anit Kumar", initials: "AK", points: 2340, color: "bg-blue-500" },
    { rank: 2, name: "Ravi Sharma", initials: "RS", points: 2150, color: "bg-green-500" },
    { rank: 3, name: "Priya Desai", initials: "PD", points: 2010, color: "bg-purple-500" },
    { rank: 4, name: "Vikram Patel", initials: "VP", points: 1895, color: "bg-pink-500" },
    { rank: 5, name: "Neha Singh", initials: "NS", points: 1750, color: "bg-yellow-500" },
    { rank: 6, name: "Arjun Nair", initials: "AN", points: 1620, color: "bg-indigo-500" },
    { rank: 7, name: "Meera Verma", initials: "MV", points: 1540, color: "bg-rose-500" },
    { rank: 8, name: "Ajay Singh", initials: "AS", points: 1420, color: "bg-cyan-500" },
  ],
  global: [
    { rank: 1, name: "Climate Warrior", initials: "CW", points: 4520, color: "bg-blue-500" },
    { rank: 2, name: "EcoHero", initials: "EH", points: 4210, color: "bg-green-500" },
    { rank: 3, name: "Green Guardian", initials: "GG", points: 3950, color: "bg-purple-500" },
    { rank: 4, name: "Carbon Crusher", initials: "CC", points: 3780, color: "bg-pink-500" },
    { rank: 5, name: "Planet Protector", initials: "PP", points: 3620, color: "bg-yellow-500" },
    { rank: 6, name: "Energy Saver", initials: "ES", points: 3480, color: "bg-indigo-500" },
    { rank: 7, name: "Plastic Fighter", initials: "PF", points: 3340, color: "bg-rose-500" },
    { rank: 8, name: "Waste Warrior", initials: "WW", points: 3210, color: "bg-cyan-500" },
  ],
};

export const missionCategories = {
  transport: { icon: "🚗", label: "Transport" },
  food: { icon: "🍽️", label: "Food" },
  energy: { icon: "⚡", label: "Energy" },
  goods: { icon: "📦", label: "Goods" },
};

export const badges = [
  { id: "b1", name: "Carbon Pro", icon: "🏆", description: "Reduced 500kg CO₂", locked: false },
  { id: "b2", name: "Tree Planter", icon: "🌱", description: "Planted 10 virtual trees", locked: false },
  { id: "b3", name: "Zero Waste Hero", icon: "♻️", description: "Single-use plastic avoided", locked: true, requirement: "Avoid 100 single-use items" },
  { id: "b4", name: "Energy Guardian", icon: "💡", description: "Saved 1000 kWh of energy", locked: true, requirement: "Save 1000 kWh energy" },
  { id: "b5", name: "Commute King", icon: "🚴", description: "Used eco-transport 50 times", locked: false },
  { id: "b6", name: "Veggie Master", icon: "🥗", description: "100 vegetarian meals logged", locked: true, requirement: "Log 100 vegetarian meals" },
];

export const rewardHistory = [
  { date: "24/4/25", points: 200, reason: "Zero Plastic Day challenge completed" },
  { date: "21/4/25", points: 150, reason: "Weekly goal exceeded" },
  { date: "18/4/25", points: 100, reason: "Product scanned" },
  { date: "15/4/25", points: 175, reason: "Community challenge joined" },
  { date: "12/4/25", points: 120, reason: "Daily streak: 7 days" },
  { date: "10/4/25", points: 90, reason: "Questionnaire completed" },
];

export const familyMembers = [
  { id: "fm1", name: "You", role: "Admin", points: 2500, co2Saved: 156 },
  { id: "fm2", name: "Mom", role: "Member", points: 1800, co2Saved: 98 },
  { id: "fm3", name: "Dad", role: "Member", points: 2100, co2Saved: 134 },
  { id: "fm4", name: "Sister", role: "Member", points: 1500, co2Saved: 76 },
];

export const expandedQuestions = [
  {
    id: "transport",
    title: "How many vehicles do you use daily?",
    options: ["None", "One", "Two", "Three+"],
  },
  {
    id: "meals",
    title: "How often do you eat packaged food?",
    options: ["Rarely", "2-3 times/week", "Once daily", "More than once/day"],
  },
  {
    id: "waste",
    title: "Do you separate wet and dry waste?",
    options: ["Always", "Sometimes", "Rarely", "Never"],
  },
  {
    id: "water",
    title: "Approximately how much water do you use daily? (liters)",
    options: ["<50L", "50-100L", "100-150L", ">150L"],
  },
  {
    id: "shopping",
    title: "How often do you buy new clothes or goods?",
    options: ["Rarely (< 2x/year)", "Occasionally (2-4x/year)", "Monthly", "Weekly or more"],
  },
  {
    id: "homeSize",
    title: "What's the size of your home?",
    options: ["Small (< 1000 sqft)", "Medium (1000-2000 sqft)", "Large (2000-3000 sqft)", "Very large (> 3000 sqft)"],
  },
  {
    id: "location",
    title: "What's your climate zone?",
    options: ["Tropical (hot/humid)", "Temperate (mild)", "Desert (hot/dry)", "Cold (freezing)"],
  },
  {
    id: "heating",
    title: "How do you mainly heat/cool your home?",
    options: ["AC/Central cooling", "Fan", "Natural ventilation", "Not applicable"],
  },
];

export const ecoCopletionTips = [
  "🌱 Start with one sustainable habit at a time. Small changes lead to big impact!",
  "♻️ Switch to reusable bags, bottles, and containers to reduce plastic waste.",
  "🚴 Try biking or walking for short trips instead of driving.",
  "🔋 Use renewable energy sources like solar panels if possible.",
  "🍃 Plant more trees or support reforestation projects.",
  "💧 Fix water leaks and take shorter showers to conserve water.",
  "🥗 Eat more plant-based meals to reduce your carbon footprint.",
  "📦 Buy less and choose eco-friendly products.",
  "🚌 Use public transportation for commuting.",
  "💡 Switch to LED bulbs and use natural light whenever possible.",
];
