// Shared video data for the application
export interface Video {
  id: number;
  title: string;
  duration: string;
  price: number;
  thumbnail: string;
  creator: string;
  description: string;
}

export interface Creator {
  name: string;
  username: string;
  avatar: string;
  banner: string;
  bio: string;
  socialLinks: {
    twitter: string;
    youtube: string;
    website: string;
  };
  stats: {
    followers: string;
    totalVideos: number;
    rating: number;
  };
}

export const mockVideos: Video[] = [
  // Maya Chen - Documentary filmmaker
  {
    id: 1,
    title: "How I Shot This Scene",
    duration: "12:34",
    price: 9.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Maya Chen",
    description: "A comprehensive breakdown of how I approached this challenging scene, including lighting setup, camera angles, and post-production techniques. Learn the professional methods I use to create cinematic shots on any budget."
  },
  {
    id: 2,
    title: "My Creative Process",
    duration: "08:15",
    price: 0,
    thumbnail: "https://placehold.co/400x200",
    creator: "Maya Chen",
    description: "An intimate look at my creative workflow from concept to completion, sharing insights on how I develop and execute visual stories. Perfect for aspiring filmmakers looking to establish their own creative process."
  },
  {
    id: 3,
    title: "Documentary BTS",
    duration: "15:22",
    price: 4.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Maya Chen",
    description: "Behind-the-scenes footage from my latest documentary project, showing the challenges and breakthroughs during production. See what really happens when the cameras aren't rolling."
  },
  
  // Alex Rivera - Photography & Tech
  {
    id: 4,
    title: "Behind the Camera",
    duration: "06:45",
    price: 0,
    thumbnail: "https://placehold.co/400x200",
    creator: "Alex Rivera",
    description: "What really happens behind the camera during professional shoots - the good, the bad, and the unexpected moments. A raw and honest look at professional video production."
  },
  {
    id: 5,
    title: "Equipment Tour",
    duration: "18:30",
    price: 12.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Alex Rivera",
    description: "Complete tour of my current gear setup and honest reviews of the equipment I use for different types of projects. Includes budget alternatives and must-have accessories."
  },
  {
    id: 6,
    title: "Studio Setup Guide",
    duration: "14:20",
    price: 8.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Alex Rivera",
    description: "Transform any space into a professional photography studio on a budget. Lighting, backdrops, and organization tips from years of experience."
  },
  
  // Sarah Thompson - Music Production
  {
    id: 7,
    title: "Beat Making Basics",
    duration: "22:15",
    price: 15.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Sarah Thompson",
    description: "Learn the fundamentals of creating beats from scratch. From drum patterns to melody creation, this comprehensive guide covers everything you need to start making music."
  },
  {
    id: 8,
    title: "Mixing Vocals",
    duration: "16:45",
    price: 11.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Sarah Thompson",
    description: "Professional vocal mixing techniques that will make your recordings sound radio-ready. EQ, compression, reverb, and automation secrets revealed."
  },
  {
    id: 9,
    title: "Free Sample Pack",
    duration: "03:30",
    price: 0,
    thumbnail: "https://placehold.co/400x200",
    creator: "Sarah Thompson",
    description: "Download my exclusive collection of royalty-free samples, loops, and one-shots. Perfect for hip-hop, R&B, and pop productions."
  },
  
  // Jamie Park - Web Development
  {
    id: 10,
    title: "React Hooks Deep Dive",
    duration: "45:12",
    price: 19.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Jamie Park",
    description: "Master React hooks with practical examples and real-world applications. From useState to custom hooks, build better React applications."
  },
  {
    id: 11,
    title: "Building APIs with Node.js",
    duration: "38:20",
    price: 17.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Jamie Park",
    description: "Complete guide to building RESTful APIs with Node.js and Express. Authentication, database integration, and deployment strategies."
  },
  {
    id: 12,
    title: "CSS Grid Tutorial",
    duration: "12:30",
    price: 0,
    thumbnail: "https://placehold.co/400x200",
    creator: "Jamie Park",
    description: "Free introduction to CSS Grid layout system. Learn how to create responsive, modern layouts with this powerful CSS feature."
  },
  
  // Lily Wang - Fashion Design
  {
    id: 13,
    title: "Pattern Making Fundamentals",
    duration: "35:45",
    price: 24.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Lily Wang",
    description: "Learn the art of pattern making from a professional fashion designer. From basic blocks to complex garments, master the foundation of fashion design."
  },
  {
    id: 14,
    title: "Sustainable Fashion Workshop",
    duration: "28:15",
    price: 18.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Lily Wang",
    description: "Discover eco-friendly fashion design practices. Sustainable materials, zero-waste techniques, and ethical production methods for modern designers."
  },
  {
    id: 15,
    title: "Fashion Sketching Tips",
    duration: "15:20",
    price: 0,
    thumbnail: "https://placehold.co/400x200",
    creator: "Lily Wang",
    description: "Free tutorial on fashion illustration techniques. Learn to sketch fashion figures, render fabrics, and communicate your design ideas effectively."
  },
  
  // Marcus Johnson - Fitness
  {
    id: 16,
    title: "Home Workout Routine",
    duration: "25:30",
    price: 9.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Marcus Johnson",
    description: "Complete bodyweight workout routine you can do anywhere. No equipment needed, suitable for all fitness levels with modifications provided."
  },
  {
    id: 17,
    title: "Nutrition Basics",
    duration: "20:45",
    price: 7.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Marcus Johnson",
    description: "Understanding macronutrients, meal planning, and healthy eating habits. Practical nutrition advice for sustainable lifestyle changes."
  },
  {
    id: 18,
    title: "Stretching Routine",
    duration: "18:00",
    price: 0,
    thumbnail: "https://placehold.co/400x200",
    creator: "Marcus Johnson",
    description: "Free daily stretching routine to improve flexibility and prevent injuries. Perfect for desk workers and athletes alike."
  }
];

export const mockCreators: { [key: string]: Creator } = {
  "maya-chen": {
    name: "Maya Chen",
    username: "maya-chen",
    avatar: "https://placehold.co/180x180",
    banner: "https://placehold.co/1200x400",
    bio: "Documentarian and digital storyteller. Sharing human stories through raw lenses.",
    socialLinks: {
      twitter: "#",
      youtube: "#",
      website: "#"
    },
    stats: {
      followers: "1.2k followers",
      totalVideos: 12,
      rating: 4.8
    }
  },
  "alex-rivera": {
    name: "Alex Rivera",
    username: "alex-rivera",
    avatar: "https://placehold.co/180x180",
    banner: "https://placehold.co/1200x400",
    bio: "Photography workshops and behind-the-scenes content creator. Teaching visual storytelling through practical tutorials.",
    socialLinks: {
      twitter: "#",
      youtube: "#",
      website: "#"
    },
    stats: {
      followers: "1.2k followers",
      totalVideos: 8,
      rating: 4.8
    }
  },
  "sarah-thompson": {
    name: "Sarah Thompson",
    username: "sarah-thompson",
    avatar: "https://placehold.co/180x180",
    banner: "https://placehold.co/1200x400",
    bio: "Music production and sound design tutorials. From bedroom producer to professional mixing engineer.",
    socialLinks: {
      twitter: "#",
      youtube: "#",
      website: "#"
    },
    stats: {
      followers: "1.2k followers",
      totalVideos: 15,
      rating: 4.9
    }
  },
  "jamie-park": {
    name: "Jamie Park",
    username: "jamie-park",
    avatar: "https://placehold.co/180x180",
    banner: "https://placehold.co/1200x400",
    bio: "Web development and coding tutorials. Building modern applications with JavaScript, React, and Node.js.",
    socialLinks: {
      twitter: "#",
      youtube: "#",
      website: "#"
    },
    stats: {
      followers: "1.2k followers",
      totalVideos: 22,
      rating: 4.7
    }
  },
  "lily-wang": {
    name: "Lily Wang",
    username: "lily-wang",
    avatar: "https://placehold.co/180x180",
    banner: "https://placehold.co/1200x400",
    bio: "Fashion design and styling masterclasses. Sustainable fashion practices and creative design processes.",
    socialLinks: {
      twitter: "#",
      youtube: "#",
      website: "#"
    },
    stats: {
      followers: "1.2k followers",
      totalVideos: 18,
      rating: 4.8
    }
  },
  "marcus-johnson": {
    name: "Marcus Johnson",
    username: "marcus-johnson",
    avatar: "https://placehold.co/180x180",
    banner: "https://placehold.co/1200x400",
    bio: "Fitness training and wellness coaching. Home workouts, nutrition guidance, and healthy lifestyle tips.",
    socialLinks: {
      twitter: "#",
      youtube: "#",
      website: "#"
    },
    stats: {
      followers: "1.2k followers",
      totalVideos: 25,
      rating: 4.9
    }
  }
};

// Legacy support - keep Maya Lee for existing routes
export const mockCreator = mockCreators["maya-chen"];

// Helper functions
export const getVideosByCreator = (creatorName: string): Video[] => {
  return mockVideos.filter(video => video.creator === creatorName);
};

export const getCreatorByUsername = (username: string): Creator | undefined => {
  return mockCreators[username];
};

export const getCreatorByName = (name: string): Creator | undefined => {
  return Object.values(mockCreators).find(creator => creator.name === name);
};

// Related videos for suggestions
export const getRelatedVideos = (currentVideoId: number): Video[] => {
  return mockVideos.filter(video => video.id !== currentVideoId).slice(0, 3);
};

// Get video by ID
export const getVideoById = (id: number): Video | undefined => {
  return mockVideos.find(video => video.id === id);
};