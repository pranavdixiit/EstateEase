import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { FaHeart, FaStar } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Listings = () => {
  const history = useHistory();
  const user = useSelector(state => state.auth.user);
  const token = localStorage.getItem('token');

  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editListing, setEditListing] = useState(null);

  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Form state (common for create and edit)
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [existingImages, setExistingImages] = useState([]);

  
const [carouselIndices, setCarouselIndices] = useState({});

const userId = user?._id || localStorage.getItem('userId');


  // Fetch listings
  useEffect(() => {
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/listings`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      // Example: if backend sends favorites list and ratings per user
      const enriched = data.map(listing => ({
        ...listing,
        isFavorite: listing.favorites ? listing.favorites.includes(userId) : false,
        userRating: listing.userRatings ? listing.userRatings[userId] || 0 : 0,
      }));
      setListings(enriched);
      setFilteredListings(enriched);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unknown error');
    }
    setLoading(false);
  };
  fetchListings();
}, [userId]);


  // Filter listings per search term
  useEffect(() => {
    const filtered = listings.filter(listing =>
      listing.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredListings(filtered);
  }, [searchTerm, listings]);

  // Favorite toggling handler
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Open modal for create or edit
  const openModal = (listing = null, e) => {
    if (e) e.stopPropagation();
    setEditListing(listing);
    if (listing) {
      setTitle(listing.title || '');
      setPrice(listing.price || '');
      setLocation(listing.location || '');
      setDescription(listing.description || '');
      setExistingImages(listing.images || []);
      setUploadFiles([]);
    } else {
      setTitle('');
      setPrice('');
      setLocation('');
      setDescription('');
      setExistingImages([]);
      setUploadFiles([]);
    }
    setUploadError('');
    setShowModal(true);
  };

  const openEditModal = (listing, e) => {
  if (e) e.stopPropagation();
  setEditListing(listing);
  setTitle(listing.title || '');
  setPrice(listing.price || '');
  setLocation(listing.location || '');
  setDescription(listing.description || '');
  setExistingImages(listing.images || []);
  setUploadFiles([]);
  setUploadError('');
  setShowModal(true);
};


  // Close modal and reset form
  const closeModal = () => {
    setShowModal(false);
    setEditListing(null);
    setUploadFiles([]);
    setExistingImages([]);
    setUploadError('');
    setTitle('');
    setPrice('');
    setLocation('');
    setDescription('');
    setUploading(false);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files));
    setUploadError('');
  };

  // Submit handler for create or edit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!title || !price || (uploadFiles.length === 0 && existingImages.length === 0)) {
      setUploadError('Please enter title, price, and select images.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Upload only new files if any selected
      let finalImages = existingImages;
      if (uploadFiles.length > 0) {
        const formData = new FormData();
        uploadFiles.forEach(file => formData.append('images', file));
        const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setUploadError(uploadData.msg || 'Image upload failed');
          setUploading(false);
          return;
        }
        finalImages = [...existingImages, ...uploadData.files];
      }

      if (!token) {
        setUploadError('Not authenticated. Please log in.');
        setUploading(false);
        return;
      }

      const payload = {
        title,
        price: Number(price),
        location,
        description,
        images: finalImages,
      };

      let res, data;
      if (editListing) {
        res = await fetch(`${API_URL}/listings/${editListing._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/listings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      data = await res.json();
      if (!res.ok) {
        setUploadError(data.msg || 'Failed to save listing');
        setUploading(false);
        return;
      }

      if (editListing) {
        setListings(prev => prev.map(l => (l._id === data._id ? data : l)));
        setFilteredListings(prev => prev.map(l => (l._id === data._id ? data : l)));
      } else {
        setListings(prev => [data, ...prev]);
        setFilteredListings(prev => [data, ...prev]);
      }

      closeModal();
    } catch {
      setUploadError('Network error during upload');
      setUploading(false);
    }
  };

  // Delete listing handler
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!token) {
      alert('Please log in to delete listings');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`${API_URL}/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || 'Failed to delete listing');
        return;
      }
      setListings(prev => prev.filter(l => l._id !== id));
      setFilteredListings(prev => prev.filter(l => l._id !== id));
    } catch {
      alert('Network error while deleting');
    }
  };

  // Navigate to detail page
  const handleCardClick = (id) => {
    history.push(`/property/${id}`);
  };

const handleFavoriteToggle = async (listingId, currentFavorite, idx) => {
  if (!token || !userId) {
    alert('Please log in to manage favorites');
    return;
  }
  
  // Optimistically update UI
  setFilteredListings(prev =>
    prev.map((l, i) => i === idx ? { ...l, isFavorite: !currentFavorite } : l)
  );
  
  try {
    const res = await fetch(`${API_URL}/listings/${listingId}/favorite-toggle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) throw new Error('Failed to toggle favorite');
    
    const data = await res.json();
    
    // Safe check for data.favorites array before using includes()
    const isFav = Array.isArray(data.favorites) ? data.favorites.includes(userId) : false;
    
    setFilteredListings(prev =>
      prev.map((l, i) =>
        i === idx ? { ...l, isFavorite: isFav } : l
      )
    );
    
  } catch (err) {
    // Revert optimistic UI change on error
    setFilteredListings(prev =>
      prev.map((l, i) => i === idx ? { ...l, isFavorite: currentFavorite } : l)
    );
    alert(err.message);
  }
};


  if (loading) return <p>Loading listings...</p>;
  if (error) return <p>{error}</p>;
  

return (
  <>
    <div className="listings-container container search-results-container">
      <div className="controls">
        <input
          type="text"
          className="search-bar-listings"
          placeholder="Search listings..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && searchTerm.trim() !== '') {
              e.preventDefault();
            }
          }}
        />
        <button className="upload-btn-listings" onClick={() => openModal(null)}>
          Upload
        </button>
      </div>

      {loading && <p>Loading listings...</p>}
      {error && <p className="error-msg">{error}</p>}
      {!loading && !error && filteredListings.length === 0 && <p>No listings found matching your search.</p>}

      <div className="listings-grid">
        {filteredListings.map((listing, idx) => {
          const currentIndex = carouselIndices[listing._id] || 0;
          const avgRating = listing.avgRating || 0;
          const images = listing.images || [];
          const isFavorite = favoriteIds.has(listing._id);
          

          return (
            <div
              key={listing._id}
              className="card"
              onClick={() => handleCardClick(listing._id)}
              role="button"
              tabIndex={0}
              onKeyPress={e => { if (e.key === 'Enter') handleCardClick(listing._id); }}
            >
              <div className="card-inner-wrapper">
                <div className="card-carousel" style={{ position: 'relative' }}>
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[currentIndex]}
                        alt={`${listing.title} - image ${currentIndex + 1}`}
                        className="carousel-image active"
                      />
                      {images.length > 1 && (
                        <>
                         
                        </>
                      )}
                    </>
                  ) : (
                    <div className="no-image-placeholder">No Image</div>
                  )}

                  <button
  className="image-favorite-button"
  onClick={e => {
    e.stopPropagation();
    handleFavoriteToggle(listing._id, listing.isFavorite, idx);
  }}
  title={listing.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
  aria-label="Toggle Favorite"
>
  <FaHeart
    className={`favorite-icon ${listing.isFavorite ? 'favorite-active' : 'favorite-inactive'}`}
  />
</button>
                </div>

                <div className="card-body">
                  <h5 className="card-title">{listing.title}</h5>
                  <div className="rating-section">
                                      {[1, 2, 3, 4, 5].map((i) =>
                                        i <= Math.round(listing.rating) ? (
                                          <FaStar key={i} className="star-icon filled" />
                                        ) : (
                                          <FaStar key={i} className="star-icon empty" />
                                        )
                                      )}
                                      <span className="avg-rating">({listing.rating.toFixed(1)})</span>
                                    </div>
                  <div className="card-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p className="card-price">${listing.price}</p>
                    <div className="card-actions" onClick={e => e.stopPropagation()}>
                      <button className="card-button update" onClick={e => openEditModal(listing, e)}>Update</button>
                      <button className="card-button delete" onClick={e => handleDelete(listing._id, e)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Modal kept same as your previous code */}
    {showModal && (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>{editListing ? 'Edit Listing' : 'Create New Listing'}</h2>
          {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
          
            <input
              className="modal-input"
              type="text"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={uploading}
              required
            />
            <textarea
              className="modal-input"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={uploading}
            />
            <input
              className="modal-input"
              type="number"
              placeholder="Price"
              value={price}
              onChange={e => setPrice(e.target.value)}
              disabled={uploading}
              required
            />
            <input
              className="modal-input"
              type="text"
              placeholder="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              disabled={uploading}
            />
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif"
              className="hidden-file-input"
              id="upload-files"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label htmlFor="upload-files" className="custom-file-label">
              {uploadFiles.length > 0
                ? `${uploadFiles.length} file${uploadFiles.length > 1 ? 's' : ''} selected`
                : 'Choose images (max 5MB each)'}
            </label>
            <div className="modal-actions">
              <button type="submit" className="btn" disabled={uploading} onClick={handleUploadSubmit}>
                {uploading ? (editListing ? 'Updating...' : 'Uploading...') : (editListing ? 'Update' : 'Create')}
              </button>
              <button type="button" className="btn" onClick={closeModal} disabled={uploading}>Cancel</button>
              
            </div>
       
        </div>
      </div>
    )}
  </>
);

};

export default Listings;
