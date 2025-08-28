import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './PropertyDetail.css';
import { FaHeart,FaBell,FaStar } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ratingEmojis = ['😞', '😕', '😐', '🙂', '😃', '🤩'];

const PropertyDetail = () => {
  const { id } = useParams();
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;
  const token = localStorage.getItem('token');

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const [notification, setNotification] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbPosition, setThumbPosition] = useState(0);

  


// Update position whenever value changes
useEffect(() => {
  if (!sliderRef.current) return;
  const slider = sliderRef.current;
  const percent = (slider.value / slider.max) * 100;
  setThumbPosition(percent);
}, [userRating]);


  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_URL}/listings/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch property details');
        const data = await res.json();
        setProperty(data);

        if (data.favorites && Array.isArray(data.favorites) && userId) {
          setIsFavorite(data.favorites.includes(userId));
        }
        setUserRating(data.rating ?? 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, token, userId]);

  // Update thumb position on rating change
  useEffect(() => {
    if (sliderRef.current) {
      const min = Number(sliderRef.current.min);
      const max = Number(sliderRef.current.max);
      const val = Number(userRating);
      const percent = ((val - min) / (max - min)) * 100;
      setThumbPosition(percent);
    }
  }, [userRating]);

useEffect(() => {
  const slider = sliderRef.current;
  if (!slider) return;
  const percent = (slider.value / slider.max) * 100;
  slider.style.background = `linear-gradient(90deg, var(--color-accent) ${percent}%, var(--color-bg-glass) ${percent}%)`;
}, [userRating]);



  // === Notify Lister ===
  const notifyLister = async () => {
    if (!token) {
      return triggerPopup('You must be logged in to notify the lister!');
    }
    if (!userId) {
      return triggerPopup('Client ID missing. Are you logged in as a client?');
    }
    setButtonDisabled(true);

    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client: userId,
          property: id,
          appointmentDate: new Date().toISOString(),
          notes: "I'm interested in this property, please contact me.",
        }),
      });

      if (!res.ok) throw new Error('Failed to send appointment request');

      triggerPopup('Appointment request sent to the agent.');
    } catch (err) {
      triggerPopup(err.message);
    } finally {
      setButtonDisabled(false);
    }
  };

  // === Toggle Favorite ===
  const toggleFavorite = async () => {
    if (!token || !userId) {
      return triggerPopup('Please log in to manage favorites');
    }

    setIsFavorite((prev) => !prev);
    setButtonDisabled(true);

    try {
      const res = await fetch(`${API_URL}/listings/${id}/favorite-toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to toggle favorite');

      const data = await res.json();
      if (data.favorites && Array.isArray(data.favorites)) {
        setIsFavorite(data.favorites.includes(userId));
      }
      triggerPopup(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (err) {
      setIsFavorite((prev) => !prev);
      triggerPopup(err.message);
    } finally {
      setButtonDisabled(false);
    }
  };

  // === Update Rating ===
  const updateRating = async () => {
    if (!token) {
      return triggerPopup('Please log in to update rating');
    }
    setButtonDisabled(true);

    try {
      const res = await fetch(`${API_URL}/listings/${id}/rating`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: userRating }),
      });

      if (!res.ok) throw new Error('Failed to update rating');

      triggerPopup('Rating updated');
    } catch (err) {
      triggerPopup(err.message);
    } finally {
      setButtonDisabled(false);
    }
  };

  // === Popup Trigger Helper ===
  const triggerPopup = (message) => {
    setNotification(message);
    setShowPopup(true);
  };

  const onAnimationEnd = (e) => {
  if (e.target.classList.contains('popup-modal')) {
    e.target.style.transform = 'translateZ(0)'; // force repaint
  }
};


  if (loading) return <p>Loading property...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!property) return <p>Property not found.</p>;

  const images = property.images || [];

  return (
    <div className="property-detail-container">
      <div className="property-horizontal-layout">
        {/* Image Carousel */}
        <div className="image-carousel glassmorphic">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImgIndex]}
                alt={`${property.title} ${currentImgIndex + 1}`}
              />
              {images.length > 1 && (
                <>
                  <button
                    className="carousel-button left"
                    onClick={() =>
                      setCurrentImgIndex(
                        (currentImgIndex - 1 + images.length) % images.length
                      )
                    }
                  >
                    ‹
                  </button>
                  <button
                    className="carousel-button right"
                    onClick={() =>
                      setCurrentImgIndex((currentImgIndex + 1) % images.length)
                    }
                  >
                    ›
                  </button>
                </>
              )}
            </>
          ) : (
            <p>No images available</p>
          )}
        </div>

        {/* Info Card */}
        <div className="property-info-section glassmorphic">
          <div className="property-info">
            <h2 className="property-title">{property.title}</h2>

            <div className="rating-fav-row">
              <p className="property-rating">
                {[1, 2, 3, 4, 5].map((i) =>
                          i <= Math.round(property.rating) ? (
                            <FaStar key={i} className="star-icon filled" />
                          ) : (
                            <FaStar key={i} className="star-icon" style={{ color: '#ddd' }} />
                          )
                        )}
              </p>
              <button
                className={`favorite-button ${
                  isFavorite ? 'favorite-active' : ''
                }`}
                onClick={toggleFavorite}
                disabled={buttonDisabled}
              >
                <span className="glassmorphic-icon">
                  <FaHeart />
                </span>
              </button>
            </div>

            <p className="property-price">${property.price}</p>
<div className="rating-update">
  {/* Heading */}
  <label htmlFor="userRatingSelect" className="rating-title">
    Your Rating
  </label>

  {/* Row: slider 2/3 + button 1/3 */}
  <div className="rating-slider-row">
    {/* Slider Section */}
    <div className="slider-container">
      <input
        ref={sliderRef}
        id="userRatingSelect"
        type="range"
        min="0"
        max="5"
        step="1"
        value={userRating}
        onChange={(e) => setUserRating(Number(e.target.value))}
        disabled={buttonDisabled}
        className="glass-slider styled-slider"
        aria-label="Rating slider"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
      />
      
      {/* Floating glassmorphic emoji label - only visible when dragging */}
      <div
        className={`slider-emoji-label ${isDragging ? "visible" : ""}`}
        style={{ left: `${thumbPosition}%` }}
      >
        {ratingEmojis[userRating]}
      </div>
    </div>

    {/* Button Section */}
    <button
      onClick={updateRating}
      disabled={buttonDisabled}
      className="update-rating-btn"
    >
      Update
    </button>
  </div>
</div>



            <div className="action-section">
              <button
                className="notify-button"
                onClick={notifyLister}
                disabled={buttonDisabled}
              >
               Notify Lister <FaBell/> 
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="property-description glassmorphic">
        <h3 className="desc-title">Description</h3>
        <div className="desc-scroll-container">
          <p>{property.description}</p>
        </div>
      </div>

      {/* POPUP Modal */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-modal glassmorphic" onAnimationEnd={onAnimationEnd}>
            <h3>Notification</h3>
            <p>{notification}</p>
            <button onClick={() => setShowPopup(false)} className='update-rating-btn'>Okay</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
