import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import listingsReducer from '../features/listings/listingsSlice';
import clientsReducer from '../features/clients/clientsSlice';
import appointmentsReducer from '../features/appointments/appointmentsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    listings: listingsReducer,
    clients: clientsReducer,
    appointments: appointmentsReducer,
  },
});

export default store;
