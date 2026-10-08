export interface MapPOIItem {
  _id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  location: string;
  description: string;
  image?: string;
  phone?: string;
  famousThing?: string;
  mapOnly: boolean;
}

export const DEFAULT_MAP_POIS: MapPOIItem[] = [
  // Spiritual & Religious
  {
    _id: "poi-1",
    name: "Trimbakeshwar Shiva Temple",
    category: "Spiritual",
    latitude: 19.9324,
    longitude: 73.5307,
    location: "Trimbak, Nashik",
    description: "One of the 12 sacred Jyotirlingas of Lord Shiva located at the source of Godavari river.",
    famousThing: "12 Jyotirlinga, Origin of Godavari River",
    image: "https://images.unsplash.com/photo-1609946782782-99c5c1630166?q=80&w=800&auto=format&fit=crop",
    mapOnly: true
  },
  {
    _id: "poi-2",
    name: "Kalaram Temple",
    category: "Religious",
    latitude: 20.0055,
    longitude: 73.7946,
    location: "Panchavati, Nashik",
    description: "Historic black stone temple dedicated to Lord Rama, constructed in 1782 by Sardar Rangarao Odhekar.",
    famousThing: "Black Stone Architecture, Ramayana Heritage",
    image: "https://tse1.mm.bing.net/th/id/OIP.Yf3Jna1gyHvITRgDZWs_ygHaFj?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-3",
    name: "Muktidham Temple",
    category: "Spiritual",
    latitude: 19.9515,
    longitude: 73.8344,
    location: "Nashik Road, Nashik",
    description: "Marble temple complex featuring replicas of all 12 Jyotirlingas and chapters of Bhagavad Gita carved on walls.",
    famousThing: "12 Jyotirlinga Replicas, Pure White Marble",
    image: "https://tse3.mm.bing.net/th/id/OIP.gS_GGalMBZPOy4MjKvpAdAHaFj?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-4",
    name: "Ramkund Ghat",
    category: "Spiritual",
    latitude: 20.0076,
    longitude: 73.7925,
    location: "Panchavati, Nashik",
    description: "Sacred bathing ghat on river Godavari where Lord Rama took baths during exile. Core site of Kumbh Mela.",
    famousThing: "Kumbh Mela Holy Dip, Sacred Asthi Visarjan",
    image: "https://tse3.mm.bing.net/th/id/OIP.7mYVV2t2MLSGhuQndrYWDgHaEK?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-5",
    name: "Someshwar Temple & Waterfalls",
    category: "Spiritual",
    latitude: 20.0264,
    longitude: 73.7381,
    location: "Gangapur Road, Nashik",
    description: "Ancient Lord Shiva temple set beside scenic Dudhsagar waterfalls along the Godavari River.",
    famousThing: "Scenic Waterfalls, Boating & Shiva Temple",
    image: "https://tse3.mm.bing.net/th/id/OIP.wMCa8FwYkXlOPOUa20NYwgHaEb?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-6",
    name: "Sundarnarayan Temple",
    category: "Religious",
    latitude: 20.0048,
    longitude: 73.7920,
    location: "Panchavati, Nashik",
    description: "Beautiful 1756 Lord Vishnu temple designed so rays of setting sun fall directly on deity on March 21.",
    famousThing: "Equinox Sun Rays Alignment, Peshwa Architecture",
    mapOnly: true
  },
  {
    _id: "poi-7",
    name: "Tapovan Ashram",
    category: "Spiritual",
    latitude: 20.0035,
    longitude: 73.8055,
    location: "Panchavati, Nashik",
    description: "Serene penance grove where Lakshmana cut off Surpanakha's nose. Confluence of Kapila & Godavari.",
    famousThing: "Ramayana History, Confluence of Rivers",
    mapOnly: true
  },
  {
    _id: "poi-8",
    name: "Kapaleshwar Temple",
    category: "Religious",
    latitude: 20.0072,
    longitude: 73.7928,
    location: "Panchavati, Nashik",
    description: "Unique Lord Shiva temple near Ramkund where there is NO Nandi idol in front of Shiva.",
    famousThing: "Shiva Temple without Nandi Bull",
    image: "https://tse4.mm.bing.net/th/id/OIP.-xEGoD8SslNpIgN0QvF46wHaEU?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-9",
    name: "Sita Gufa",
    category: "Spiritual",
    latitude: 20.0062,
    longitude: 73.7950,
    location: "Panchavati, Nashik",
    description: "Narrow ancient cave where Goddess Sita stayed and was abducted by Ravana.",
    famousThing: "Goddess Sita Cave, Ancient Banyan Trees",
    image: "https://tse4.mm.bing.net/th/id/OIP.vUyDj3zjeQox4cNSqcPD7QHaEI?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-10",
    name: "Dharmachakra Prabhav Tirth Jain Mandir",
    category: "Spiritual",
    latitude: 19.9248,
    longitude: 73.7410,
    location: "Vilholi, Nashik",
    description: "Grand Jain pilgrimage complex featuring heavy gold-plated idols and pink stone carvings.",
    famousThing: "24 Tirthankara Sculptures, Architectural Marvel",
    mapOnly: true
  },

  // Historic & Tourist Spots
  {
    _id: "poi-11",
    name: "Pandavleni Caves",
    category: "Historic",
    latitude: 19.9442,
    longitude: 73.7663,
    location: "Pathardi Phata, Nashik",
    description: "Group of 24 rock-cut Buddhist caves dating back to the 1st century BCE to 3rd century CE.",
    famousThing: "2000-Year Rock-Cut Caves, Panoramic Nashik View",
    image: "https://tse1.mm.bing.net/th/id/OIP.dJ9O2v1x5Q5-RT4G7IvxAwHaFQ?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-12",
    name: "Gargoti Mineral Museum",
    category: "Historic",
    latitude: 19.8660,
    longitude: 73.9215,
    location: "Sinnar, Nashik",
    description: "India's only mineral museum exhibiting rare natural zeolites, gems, crystals, and rocks.",
    famousThing: "World-Class Zeolite & Gemstone Collection",
    mapOnly: true
  },
  {
    _id: "poi-13",
    name: "Coin Museum (INSAF)",
    category: "Historic",
    latitude: 19.9820,
    longitude: 73.5680,
    location: "Trimbak Road, Nashik",
    description: "Indian Institute of Research in Numismatic Studies documenting Indian currency history through millennia.",
    famousThing: "Ancient Indian Coins & Currency History",
    mapOnly: true
  },
  {
    _id: "poi-14",
    name: "Artillery Centre Museum",
    category: "Tourist Spot",
    latitude: 19.9650,
    longitude: 73.8150,
    location: "Nashik Road Military Station, Nashik",
    description: "Asia's largest artillery military museum displaying historic cannons, military tanks, and battle weapons.",
    famousThing: "Military Tanks, War Artillery & Historic Guns",
    mapOnly: true
  },

  // Treks & Mountains
  {
    _id: "poi-15",
    name: "Anjaneri Hill Fort & Hanuman Birthplace",
    category: "Trek",
    latitude: 19.9192,
    longitude: 73.5708,
    location: "Anjaneri, Nashik",
    description: "Sacred mountain fort considered the birthplace of Lord Hanuman. Popular scenic trekking trail.",
    famousThing: "Birthplace of Lord Hanuman, Footprint Rock",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
    mapOnly: true
  },
  {
    _id: "poi-16",
    name: "Brahmagiri Mountain & Godavari Source",
    category: "Mountains",
    latitude: 19.9310,
    longitude: 73.5180,
    location: "Trimbakeshwar, Nashik",
    description: "Majestic mountain ridge overlooking Trimbak town. Steps lead to Godavari river origin (Gangadwar).",
    famousThing: "Godavari River Origin Point, Cloud Trail",
    mapOnly: true
  },
  {
    _id: "poi-17",
    name: "Harihar Fort Trek",
    category: "Trek",
    latitude: 19.9015,
    longitude: 73.4712,
    location: "Nirgudpada, Nashik",
    description: "World-famous iconic fort featuring 80-degree near-vertical rock-cut rock staircase steps.",
    famousThing: "Vertical Rock Stairs, Iconic Thrill Trek",
    image: "https://tse2.mm.bing.net/th/id/OIP.xMwipKrTkf1kNAcZgBKG4gHaHa?r=0&pid=Api&h=220&P=0",
    mapOnly: true
  },
  {
    _id: "poi-18",
    name: "Ramshej Fort Trek",
    category: "Trek",
    latitude: 20.1085,
    longitude: 73.7842,
    location: "Peth Road, Nashik",
    description: "Historic fort where Maratha army successfully defended against Mughal siege for over 5 years.",
    famousThing: "Maratha Defense History, Quick Weekend Trek",
    mapOnly: true
  },
  {
    _id: "poi-19",
    name: "Salher Fort Peak",
    category: "Mountains",
    latitude: 20.7215,
    longitude: 73.9405,
    location: "Satana, Nashik District",
    description: "The highest fort peak in Maharashtra at 1,567 meters altitude with ancient rock tanks.",
    famousThing: "Highest Fort Peak in Maharashtra (1567m)",
    mapOnly: true
  },

  // Famous Hotels & Stays
  {
    _id: "poi-20",
    name: "Taj Gateway Hotel Ambad",
    category: "Hotels",
    latitude: 19.9480,
    longitude: 73.7460,
    location: "Ambad MIDC, Nashik",
    description: "5-star luxury hotel surrounded by 11 acres of manicured gardens and premium suites.",
    phone: "+91 253 669 2333",
    mapOnly: true
  },
  {
    _id: "poi-21",
    name: "Express Inn Hotel",
    category: "Hotels",
    latitude: 19.9472,
    longitude: 73.7620,
    location: "Pathardi Phata, Mumbai-Agra Highway, Nashik",
    description: "Luxury 5-star business hotel featuring rooftop poolside lounge Freasia & multi-cuisine dining.",
    phone: "+91 253 664 1111",
    mapOnly: true
  },
  {
    _id: "poi-22",
    name: "Radisson Blu Hotel & Spa",
    category: "Hotels",
    latitude: 19.9530,
    longitude: 73.7550,
    location: "Pathardi Phata, Nashik",
    description: "Urban resort offering panoramic mountain views, international spa, and luxury dining.",
    phone: "+91 253 260 0000",
    mapOnly: true
  },
  {
    _id: "poi-23",
    name: "Courtyard by Marriott Nashik",
    category: "Hotels",
    latitude: 19.9880,
    longitude: 73.7740,
    location: "Mumbai Naka, Nashik",
    description: "Modern upscale city hotel featuring luxury amenities and convenient access to highway.",
    phone: "+91 253 230 9999",
    mapOnly: true
  },

  // Famous Restaurants & Food
  {
    _id: "poi-24",
    name: "Sadhana Chulivarchi Misal",
    category: "Restaurants",
    latitude: 20.0385,
    longitude: 73.7310,
    location: "Hardev Nagar, Bardan Phata, Nashik",
    description: "Iconic traditional wood-fired chulivarchi misal served with fresh jalebis & gulab jamuns in rural setting.",
    famousThing: "Clay-pot Woodfire Spicy Misal Pav",
    mapOnly: true
  },
  {
    _id: "poi-25",
    name: "Hotel Divtya Budhlya",
    category: "Restaurants",
    latitude: 20.0090,
    longitude: 73.7710,
    location: "Gangapur Road, Nashik",
    description: "Famous authentic Khandeshi & Maharashtrian non-veg thali restaurant.",
    famousThing: "Mutton Kala Masala Thali",
    mapOnly: true
  },
  {
    _id: "poi-26",
    name: "Hotel Panchratna Misal",
    category: "Restaurants",
    latitude: 20.0068,
    longitude: 73.7915,
    location: "Panchavati, Nashik",
    description: "Legendary traditional breakfast spot serving spicy Nashik Misal right in Panchavati.",
    famousThing: "Classic Panchavati Spicy Misal",
    mapOnly: true
  },

  // Hospitals & Emergency
  {
    _id: "poi-27",
    name: "Apollo Hospitals Nashik",
    category: "Hospitals",
    latitude: 19.9720,
    longitude: 73.7750,
    location: "Swaminarayan Nagar, Mumbai Naka, Nashik",
    description: "24/7 Multi-speciality tertiary care super-specialty hospital with advanced trauma unit.",
    phone: "1066 / +91 253 230 3333",
    mapOnly: true
  },
  {
    _id: "poi-28",
    name: "Wockhardt Hospital",
    category: "Hospitals",
    latitude: 19.9890,
    longitude: 73.7780,
    location: "Mumbai Naka, Nashik",
    description: "Multi-specialty super-specialty healthcare centre with round-the-clock emergency response.",
    phone: "+91 253 662 4444",
    mapOnly: true
  },
  {
    _id: "poi-29",
    name: "Sahyadri Super Speciality Hospital",
    category: "Hospitals",
    latitude: 19.9980,
    longitude: 73.7680,
    location: "Bhavik Complex, Mumbai Naka, Nashik",
    description: "Leading multi-specialty cardiac, neuro, and critical care medical hospital.",
    phone: "+91 253 664 0000",
    mapOnly: true
  },
  {
    _id: "poi-30",
    name: "Civil Hospital Nashik",
    category: "Emergency",
    latitude: 20.0010,
    longitude: 73.7850,
    location: "Trimbak Road, Nashik",
    description: "Primary government district general hospital with 24x7 emergency medical service.",
    phone: "+91 253 257 2038",
    mapOnly: true
  },

  // Public Toilets & Facilities
  {
    _id: "poi-31",
    name: "Public Toilet - Ramkund Ghat",
    category: "Public Toilets",
    latitude: 20.0078,
    longitude: 73.7928,
    location: "Ramkund Bathing Ghat, Panchavati",
    description: "Clean public restroom facility maintained by NMC for pilgrims visiting Ramkund.",
    famousThing: "Pilgrim Restroom Facility",
    mapOnly: true
  },
  {
    _id: "poi-32",
    name: "Public Toilet - CBS Central Bus Stand",
    category: "Public Toilets",
    latitude: 19.9985,
    longitude: 73.7820,
    location: "CBS Bus Stand, Old Agra Road",
    description: "Public sanitation complex at Nashik central bus station.",
    famousThing: "24x7 Bus Station Restroom",
    mapOnly: true
  },
  {
    _id: "poi-33",
    name: "Public Toilet - Shalimar Circle",
    category: "Public Toilets",
    latitude: 19.9995,
    longitude: 73.7870,
    location: "Shalimar Chowk, Nashik",
    description: "Public sanitation facility located near Shalimar market intersection.",
    famousThing: "Market Area Public Restroom",
    mapOnly: true
  },
  {
    _id: "poi-34",
    name: "Public Toilet - Nashik Road Railway Station",
    category: "Public Toilets",
    latitude: 19.9485,
    longitude: 73.8360,
    location: "Nashik Road Station Platform 1 Exit",
    description: "24/7 Pay & Use clean public toilet complex for train passengers.",
    famousThing: "Railway Station Pay & Use Toilet",
    mapOnly: true
  },
  {
    _id: "poi-35",
    name: "Public Toilet - Trimbak Bus Station",
    category: "Public Toilets",
    latitude: 19.9340,
    longitude: 73.5320,
    location: "Trimbakeshwar Bus Stand",
    description: "Pilgrim public toilet facility near Trimbakeshwar temple entrance.",
    famousThing: "Trimbak Temple Visitor Facility",
    mapOnly: true
  }
];
