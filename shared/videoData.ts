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

export const mockVideos: Video[] = [
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
    title: "Location Scouting",
    duration: "09:12",
    price: 5.99,
    thumbnail: "https://placehold.co/400x200",
    creator: "Sarah Thompson",
    description: "My systematic approach to finding and securing perfect filming locations. Learn how to negotiate with property owners and make any location work for your vision."
  }
];

export const mockCreator = {
  name: "Maya Lee",
  avatar: "https://placehold.co/180x180",
  banner: "https://placehold.co/1200x400",
  bio: "Documentarian and digital storyteller. Sharing human stories through raw lenses.",
  socialLinks: {
    twitter: "#",
    youtube: "#",
    website: "#"
  }
};

// Related videos for suggestions
export const getRelatedVideos = (currentVideoId: number): Video[] => {
  return mockVideos.filter(video => video.id !== currentVideoId).slice(0, 3);
};

// Get video by ID
export const getVideoById = (id: number): Video | undefined => {
  return mockVideos.find(video => video.id === id);
};