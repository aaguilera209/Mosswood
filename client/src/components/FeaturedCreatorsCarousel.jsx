import React, { useState } from 'react';
import Slider from 'react-slick';
import './FeaturedCreatorsCarousel.css';

const FeaturedCreatorsCarousel = ({ creators = [] }) => {
  const [hoveredId, setHoveredId] = useState(null);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  if (!creators || creators.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No creators to display</p>
      </div>
    );
  }

  return (
    <div className="featured-carousel">
      <h2>Featured Creators</h2>
      <p className="subtitle">Discover amazing talent from our community</p>
      <Slider {...settings}>
        {creators.map((creator, index) => (
          <div
            key={creator.username || creator.id || index}
            className="creator-card"
            onMouseEnter={() => setHoveredId(creator.username || creator.id || index)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="image-container">
              <img 
                src={`https://picsum.photos/400/300?random=${index + 1}`} 
                alt={`${creator.displayName || creator.name} thumbnail`} 
              />
              {hoveredId === (creator.username || creator.id || index) && (
                <div className="play-button">
                  <div className="circle">
                    <span className="arrow">▶</span>
                  </div>
                </div>
              )}
              <div className="video-count">{creator.videoCount || creator.videos || 0} videos</div>
            </div>
            <div className="creator-info">
              <div className="creator-name">
                {creator.displayName || creator.name}
                {(creator.isVerified || creator.verified) && <span className="verified-badge">✔</span>}
              </div>
              <div className="creator-description">{creator.description}</div>
              <div className="meta">
                ⭐ {creator.rating || '4.8'} · 👥 {creator.followers || '1.2k'} followers
              </div>
              <button className="storefront-button">Visit Storefront</button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export { FeaturedCreatorsCarousel };
export default FeaturedCreatorsCarousel;