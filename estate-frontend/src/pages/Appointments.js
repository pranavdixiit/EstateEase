import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const API_URL = process.env.REACT_APP_API_URL ;

const Appointments = () => {
  const user = useSelector(state => state.auth.user);
  const token = localStorage.getItem('token');

  const [showIncoming, setShowIncoming] = useState(true);
  const [incomingAppointments, setIncomingAppointments] = useState([]);
  const [outgoingAppointments, setOutgoingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    if (!token) {
      setError('Please log in to view appointments.');
      return;
    }

    setLoading(true);
    setError(null);


    try {
      const res = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      setIncomingAppointments(data.incoming || []);
      setOutgoingAppointments(data.outgoing || []);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update appointment status (confirm, cancel)
  const handleStatusUpdate = async (id, status) => {
    if (!token) {
      alert('Please log in to update appointment.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      alert('Appointment status updated');
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete appointment
  const handleDelete = async (id) => {
    if (!token) {
      alert('Please log in to delete appointment.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete appointment');
      alert('Appointment deleted');
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  // Choose which appointments to display
  const appointments = showIncoming ? incomingAppointments : outgoingAppointments;

  return (
    <div className="appointments-container">
      <div className="appointments-toggle">
        <button
          className={`toggle-btn ${showIncoming ? 'active' : ''}`}
          onClick={() => setShowIncoming(true)}
        >
          Incoming
        </button>
        <button
          className={`toggle-btn ${!showIncoming ? 'active' : ''}`}
          onClick={() => setShowIncoming(false)}
        >
          Outgoing
        </button>
      </div>

      {loading && <p>Loading appointments...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <p style={{ textAlign: 'center' }}>
          No {showIncoming ? 'incoming' : 'outgoing'} appointments found.
        </p>
      )}

      {!loading && !error && appointments.length > 0 && (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Date</th>
              <th>Client</th>
              <th>Status</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(app => (
              <tr key={app._id}>
                <td data-label="Property">{app.property?.title || 'N/A'}</td>
                <td data-label="Date">{new Date(app.appointmentDate).toLocaleString()}</td>
                <td data-label="Client">{app.client?.name || 'N/A'}</td>
                <td
                  data-label="Status"
                  className={`status-${app.status}`}
                >
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </td>
                <td data-label="Email" >{app.client.email|| '-'}</td>
                <td data-label="Actions">
                  {showIncoming && app.status === 'pending' && (
                    <button
                      className="confirm-btn"
                      onClick={() => handleStatusUpdate(app._id, 'confirmed')}
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(app._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Appointments;
