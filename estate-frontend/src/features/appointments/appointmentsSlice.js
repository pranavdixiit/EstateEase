import { createSlice } from '@reduxjs/toolkit';

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: [],
  reducers: {
    // Add reducers if needed, e.g. addAppointment, removeAppointment, updateAppointment
  },
});

export default appointmentsSlice.reducer;
