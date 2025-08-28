import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import LoginPopup from '../components/LoginPopup';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { FaHome, FaUserFriends, FaCalendarAlt, FaUser, FaAngleRight, FaAngleLeft, FaStar, FaSearch} from "react-icons/fa";



import './Home.css';

const API_URL = process.env.REACT_APP_API_URL;
//const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const Home = () => {
  // Local state
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);


  // Notification badge counts
  const [newClientsCount, setNewClientsCount] = useState(0);
  const [newAppointmentsCount, setNewAppointmentsCount] = useState(0);

  // Get user and token
  const user = useSelector((state) => state.auth.user);
  const token = localStorage.getItem('token');
  const userIsLoggedIn = !!token;

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const history = useHistory();


   const userId = user?._id || '';
const favouriteProperties = Array.isArray(listings)
  ? listings.filter(
      l =>
        l &&
        Array.isArray(l.favorites) &&
        userId &&
        l.favorites.includes(userId)
    )
  : [];

  



  // Fetch listings
  useEffect(() => {
    fetch(`${API_URL}/listings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch listings');
        return res.json();
      })
      .then((data) => {
        setListings(data);
        setListingsLoading(false);
      })
      .catch((err) => {
        setListingsError(err.message);
        setListingsLoading(false);
      });
  }, [token]);

  // Show login popup if not logged in
  
  useEffect(() => {
    if (!userIsLoggedIn) return;

    const fetchCounts = () => {
      fetch(`${API_URL}/notifications/counts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch notification counts');
          return res.json();
        })
        .then((data) => {
          setNewClientsCount(data.newClients || 0);
          setNewAppointmentsCount(data.newAppointments || 0);
        })
        .catch(() => {
          setNewClientsCount(0);
          setNewAppointmentsCount(0);
        });
    };

    // Initial fetch
    fetchCounts();

    // Poll every 30 seconds
    const intervalId = setInterval(fetchCounts, 30000);

    return () => clearInterval(intervalId);
  }, [API_URL, token, userIsLoggedIn]);

  // Navigation helpers
  const goToProperty = (id) => history.push(`/property/${id}`);

  const trendingProperties = listings
    .slice()
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const topPicks = listings
  .filter((l) => l.rating > 0)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 10);

const featuredProperties = useMemo(() => {
  return topPicks.length > 0 ? topPicks : (listings.length > 0 ? [listings[0]] : []);
}, [topPicks, listings]);

const currentProperty = featuredProperties[currentIndex] || null;



const animateSlide = (targetIndex) => {
  if (animating) return;

  setAnimating(true);
  setFade(false);
  setTimeout(() => {
    setCurrentIndex(targetIndex);
    setFade(true);
    setTimeout(() => setAnimating(false), 200);
  }, 200);
};


const prevSlide = useCallback(() => {
  if (featuredProperties.length === 0) return;
  const target = currentIndex === 0 ? featuredProperties.length - 1 : currentIndex - 1;
  animateSlide(target);
}, [currentIndex, featuredProperties, animating]);

const nextSlide = useCallback(() => {
  if (featuredProperties.length === 0) return;
  const target = currentIndex === featuredProperties.length - 1 ? 0 : currentIndex + 1;
  animateSlide(target);
}, [currentIndex, featuredProperties, animating]);

  useEffect(() => {
  if (animating) return;

  const intervalId = setInterval(() => {
    nextSlide();
  }, 3000); // Change slide every 3 seconds

  return () => clearInterval(intervalId);
}, [animating, nextSlide]);

  // Listings filtering and categorization


  const markAllClientsAsSeen = async () => {
  try {
    const response = await fetch(`${API_URL}/clients/markAllSeen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to mark clients as seen');
  } catch (err) {
    console.error(err);
  }
};

// Helper function to mark all appointments as seen in backend
const markAllAppointmentsAsSeen = async () => {
  try {
    const response = await fetch(`${API_URL}/appointments/markAllSeen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to mark appointments as seen');
  } catch (err) {
    console.error(err);
  }
};

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    setShowProfilePopup(false);
    window.location.reload();
  };

  // Panel navigation handlers - show login popup if not logged in
  const handleListingClick = () => {
    if (!userIsLoggedIn) setShowLoginPopup(true);
    else history.push('/listings');
  };

  const handleClientClick = async () => {
  if (!userIsLoggedIn) return setShowLoginPopup(true);

  await markAllClientsAsSeen();   // Mark on backend
  setNewClientsCount(0);          // Reset local count

  history.push('/clients');
};

// Update handleAppointmentClick similarly
const handleAppointmentClick = async () => {
  if (!userIsLoggedIn) return setShowLoginPopup(true);

  await markAllAppointmentsAsSeen();  // Mark on backend
  setNewAppointmentsCount(0);         // Reset local count

  history.push('/appointments');
};


  return (
    <div className="page">
      <div className="panel-grid">
        {/* Trending Properties Panel */}
        <section className="trending-panel">
          <h3 className="panel-title">Trending Properties</h3>
          {listingsLoading ? (
            <p>Loading...</p>
          ) : listingsError ? (
            <p>{listingsError}</p>
          ) : (
            <ul className="panel-list">
              {trendingProperties.map((l) => (
                <li key={l._id} className="panel-item" onClick={() => goToProperty(l._id)}>
  <img
    src={
  Array.isArray(l.images)
    ? l.images[0]   // Use full ImgBB URL directly
    : l.image
}

    alt={l.title}
    className="panel-image"
  />
  <span className="panel-item-text">
    <div className="title-ellipsis" title={l.title}>{l.title}</div>
    <div className="views-text">{l.views} views</div>
  </span>
</li>
              ))}
            </ul>
          )}
        </section>

        {/* Top Picks Panel */}
        <section className="top-picks-panel">
          <h3 className="panel-title">Top Picks</h3>
          {listingsLoading ? (
            <p>Loading...</p>
          ) : listingsError ? (
            <p>{listingsError}</p>
          ) : (
            <ul className="panel-list">
              {topPicks.map((l) => (
                <li key={l._id} className="panel-item" onClick={() => goToProperty(l._id)}>
                  <img
                    src={
  Array.isArray(l.images)
    ? l.images[0]   // Use full ImgBB URL directly
    : l.image
}

                    alt={l.title}
                    className="panel-image"
                  />
                  <span className="panel-item-text">
                   <div className="title-ellipsis" title={l.title}>{l.title}</div> <span className="rating">{l.rating} <FaStar/></span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Search Panel */}
        <section className="search-panel">
  
<input
  type="text"
  className="search-input"
  placeholder="Search Properties"
  value={search}
  onChange={(e) => { setSearch(e.target.value); setCurrentIndex(0); }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      e.preventDefault();
      history.push(`/search-results?query=${encodeURIComponent(search.trim())}`);
    }
  }}
/>



        </section>

        {/*User panel */}

      <section className="user-panel">
  <div className="inner-container">
    <div className="user-info-container">
      <div className="user-info">
        <span className="user-name">{user?.name || "Guest User"}</span>
        <span className="user-email">{user?.email || "Not logged in "}</span>
      </div>
      <button
        className="user-button big-round"
        onClick={() => setShowProfilePopup(true)}
        title="Profile"
      >
        <FaUser />
      </button>
    </div>

    <div className="user-actions-container">
      <div className="action-btn-with-label">
        <button className="action-button rounded-rect" onClick={handleListingClick}>
          <FaHome />
        </button>
        <div className="action-label">Listing</div>
      </div>

      <div className="action-btn-with-label">
        <button className="action-button rounded-rect" onClick={handleClientClick}>
          <FaUserFriends />
          {newClientsCount > 0 && (
            <div className="badge-container">
              <span className="notification-badge">{newClientsCount}</span>
            </div>
          )}
        </button>
        <div className="action-label">Clients</div>
      </div>

      <div className="action-btn-with-label">
        <button className="action-button rounded-rect" onClick={handleAppointmentClick}>
          <FaCalendarAlt />
          {newAppointmentsCount > 0 && (
            <div className="badge-container">
              <span className="notification-badge">{newAppointmentsCount}</span>
            </div>
          )}
        </button>
        <div className="action-label">Appointment</div>
      </div>
    </div>
  </div>

  
</section>
{showLoginPopup && (
    <LoginPopup visible={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
  )}

        {/* Profile Popup Modal */}
        {showProfilePopup && (
          <div className="modal-overlay" onClick={() => setShowProfilePopup(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {user && user.name ? (
                <>
                  <h2>User Information</h2>
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <button className="logout-button" onClick={handleLogout} style={{ marginRight: '8px' }}>
                    Logout
                  </button>
                  <button className="close-button" onClick={() => setShowProfilePopup(false)}>Close</button>
                </>
              ) : (
                <>
                  <h2>No User Data</h2>
                  <button className="login-button" onClick={() => history.push('/login')}>Login</button>
                  <button className="close-button" onClick={() => setShowProfilePopup(false)} style={{ marginTop: '12px' }}>Close</button>
                </>
              )}
            </div>
          </div>
        )}

       <section className="favourites-panel">
  <h3 className="panel-title">Favourites</h3>
  {listingsLoading ? (
    <p>Loading...</p>
  ) : listingsError ? (
    <p>{listingsError}</p>
  ) : favouriteProperties.length > 0 ? (
    <ul className="panel-list">
      {favouriteProperties.map((l) => (
        <li key={l._id} className="panel-item" onClick={() => goToProperty(l._id)}>
          <img
            src={
  Array.isArray(l.images)
    ? l.images[0]   // Use full ImgBB URL directly
    : l.image
}

            alt={l.title}
            className="panel-image"
          />
          <span className="panel-item-text">
            <div className="title-ellipsis" title={l.title}>{l.title}</div><span className="rating">{l.rating} <FaStar/></span>
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <div className="empty-msg">No favourite properties found.</div>
  )}
</section>


        {/* Center Panel */}
<main className="center-panel">
  <h2 className="center-title">Top Performing Listing</h2>
  {listingsLoading ? (
    <div className="empty-msg">Loading...</div>
  ) : listingsError ? (
    <div className="empty-msg">{listingsError}</div>
  ) : !currentProperty ? (
    <div className="empty-msg">No properties found.</div>
  ) : (
    <div className="carousel">
      <button
        onClick={prevSlide}
        className="nav-button left"
        aria-label="Previous Property"
        disabled={animating}
      >
        <FaAngleLeft />
      </button>
      <div
        className="card-image-container"
        onClick={() => history.push(`/property/${currentProperty._id}`)}
      >
        <img
src={currentProperty.images && currentProperty.images.length > 0
  ? currentProperty.images[0]  // Use full ImgBB URL directly
  : 'https://via.placeholder.com/400x300?text=No+Image'}

  alt={currentProperty.title}
  className={`carousel-card-image ${fade ? 'fade-in' : 'fade-out'}`}
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
    pointerEvents: 'none',
  }}
/>

        <div className="carousel-text-overlay" style={{ pointerEvents: 'none' }}>
          <h3 className="carousel-card-title">{currentProperty.title}</h3>
          <p className="carousel-card-rating">
            Rating: {currentProperty.rating} <FaStar />
          </p>
        </div>
      </div>
      <button
        onClick={nextSlide}
        className="nav-button right"
        aria-label="Next Property"
        disabled={animating}
      >
        <FaAngleRight />
      </button>
    </div>
  )}
</main>

        
      </div>
    </div>
  );
};

export default Home;
