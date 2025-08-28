import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  list: [],
  loading: false,
  error: null,
};

// Fetch all listings
export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/listings');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch listings');
    }
  }
);

// Delete a listing by id
export const deleteListing = createAsyncThunk(
  'listings/deleteListing',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/listings/${id}`);
      return id;  // Return deleted listing id to update state
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to delete listing');
    }
  }
);

// Toggle favorite status for a listing by id
export const toggleFavorite = createAsyncThunk(
  'listings/toggleFavorite',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/listings/${id}/favorite-toggle`);
      return response.data; // New listing data with updated favorite state
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to toggle favorite');
    }
  }
);

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteListing.fulfilled, (state, action) => {
        // Remove the deleted listing from the list
        state.list = state.list.filter(listing => listing._id !== action.payload);
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(toggleFavorite.fulfilled, (state, action) => {
        // Update the specific listing with new favorite state
        const index = state.list.findIndex(listing => listing._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export default listingsSlice.reducer;
