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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kalaram_Temple%2C_Nashik.jpg/800px-Kalaram_Temple%2C_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Muktidham_Temple_Nashik.jpg/800px-Muktidham_Temple_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Ramkund_Nashik_India.jpg/800px-Ramkund_Nashik_India.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Someshwar_waterfall_Nashik.jpg/800px-Someshwar_waterfall_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Sundarnarayan_Temple_Nashik.jpg/800px-Sundarnarayan_Temple_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Tapovan_Nashik.jpg/800px-Tapovan_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Kapaleshwar_Temple_Nashik.jpg/800px-Kapaleshwar_Temple_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Sita_Gufa_Panchavati_Nashik.jpg/800px-Sita_Gufa_Panchavati_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Jain_temple_Nashik.jpg/800px-Jain_temple_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pandavleni_Caves_Nashik.jpg/800px-Pandavleni_Caves_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Gargoti_Museum_Nashik.jpg/800px-Gargoti_Museum_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Indian_Coin_Museum.jpg/800px-Indian_Coin_Museum.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Artillery_Museum_Nashik.jpg/800px-Artillery_Museum_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Anjaneri_hill_Nashik.jpg/800px-Anjaneri_hill_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Brahmagiri_Trimbakeshwar.jpg/800px-Brahmagiri_Trimbakeshwar.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Harihar_Fort_Nashik.jpg/800px-Harihar_Fort_Nashik.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Ramshej_Fort.jpg/800px-Ramshej_Fort.jpg",
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
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Salher_Fort_Maharashtra.jpg/800px-Salher_Fort_Maharashtra.jpg",
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
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=800&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop",
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
