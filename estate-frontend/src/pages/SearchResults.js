import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { FaStar, FaHeart } from 'react-icons/fa';
import './SearchResults.css'; // Import the new CSS file

const API_URL = process.env.REACT_APP_API_URL;

const SearchResults = () => {
  const location = useLocation();
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('query') || '';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlled search term state for search bar in this page (optional)
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  // Carousel indices for images in listings
  const [carouselIndices, setCarouselIndices] = useState({});

  // Fetch and filter listings based on searchQuery when component mounts or changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/listings`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch listings');
        return res.json();
      })
      .then((data) => {
        const keyword = searchQuery.toLowerCase();
        const filtered = data.filter(
          (listing) =>
            (listing.title && listing.title.toLowerCase().includes(keyword)) ||
            (listing.description && listing.description.toLowerCase().includes(keyword))
        );
        setListings(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchQuery]);

  // Handle image carousel navigation
  const nextImage = (id) => {
    setCarouselIndices((prev) => {
      const currentIndex = prev[id] || 0;
      const listing = listings.find((l) => l._id === id);
      if (!listing) return prev;
      const nextIndex = (currentIndex + 1) % listing.images.length;
      return { ...prev, [id]: nextIndex };
    });
  };

  const prevImage = (id) => {
    setCarouselIndices((prev) => {
      const currentIndex = prev[id] || 0;
      const listing = listings.find((l) => l._id === id);
      if (!listing) return prev;
      const prevIndex = (currentIndex - 1 + listing.images.length) % listing.images.length;
      return { ...prev, [id]: prevIndex };
    });
  };

  // Optional: Favoriting functionality placeholders
  const isFavorited = (listing) => {
    // Implement favorite checking logic if needed
    return false;
  };

  const handleFavoriteToggle = (id) => {
    // Implement favorite toggle logic if needed
    alert(`Favorite toggled for listing ${id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to the same page with updated query param (refresh results)
    if (searchTerm.trim() !== '') {
      history.push(`/search-results?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };


  return (
    <div className="listings-container container search-results-container">
      <div className="controls">

          <input
            type="text"
            className="search-bar-listings"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      e.preventDefault();
      history.push(`/search-results?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  }}
          />
          <button type="submit" className="search-submit-btn" onClick={handleSearchSubmit}>Search</button>
      
      </div>

      {loading && <p>Loading listings...</p>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && !error && listings.length === 0 && <p>No listings found matching your search.</p>}

      <div className="listings-grid">
        {listings.map((listing) => {
          const currentIndex = carouselIndices[listing._id] || 0;
          const avgRating = listing.rating || 0;

          return (
            <div
              key={listing._id}
              className="card"
              onClick={() => history.push(`/property/${listing._id}`)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') history.push(`/property/${listing._id}`); }}
            >
              <div className="card-inner-wrapper">
                <div className="card-carousel" style={{ position: 'relative' }}>
                  {listing.images && listing.images.length > 0 ? (
                    <>
                      <img
  src={listing.images[currentIndex]}  // direct ImgBB URL
  alt={`${listing.title} - image ${currentIndex + 1}`}
  className="carousel-image active"
/>

                      
                    </>
                  ) : (
                    <div className="no-image-placeholder">No Image</div>
                  )}

                  <button
                    className="image-favorite-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFavoriteToggle(listing._id);
                    }}
                    title={isFavorited(listing) ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label="Toggle Favorite"
                  >
                    <FaHeart
                      className={`favorite-icon ${isFavorited(listing) ? 'favorite-active' : 'favorite-inactive'}`}
                    />
                  </button>
                </div>

                <div className="card-body">
                  <h5 className="card-title">{listing.title}</h5>

                  <div className="rating-section">
                    {[1, 2, 3, 4, 5].map((i) =>
                      i <= Math.round(avgRating) ? (
                        <FaStar key={i} className="star-icon filled" />
                      ) : (
                        <FaStar key={i} className="star-icon empty" />
                      )
                    )}
                    <span className="avg-rating">({avgRating.toFixed(1)})</span>
                  </div>

                  <div className="card-info d-flex justify-content-between align-items-center">
                    <p className="card-price">${listing.price}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
