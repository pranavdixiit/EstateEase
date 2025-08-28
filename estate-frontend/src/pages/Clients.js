import React, { useEffect, useState } from 'react';
import './Clients.css';

const API_URL = process.env.REACT_APP_API_URL;

const Clients = ({ refreshTrigger }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('token');

  const fetchClients = () => {
    setLoading(true);
    fetch(`${API_URL}/clients`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch clients');
        return res.json();
      })
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, [token, refreshTrigger]);

  // Call this when user clicks a client row to mark it as seen
  const markClientAsSeen = async (clientId) => {
    try {
      await fetch(`${API_URL}/clients/${clientId}/markSeen`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Optionally you can update local state or refresh notifications here
    } catch (err) {
      console.error('Error marking client seen:', err);
    }
  };

  // Confirm client request
  const confirmClient = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to confirm client request');

      const updatedClient = await response.json();

      setClients(prevClients => {
        const exists = prevClients.find(c => c._id === updatedClient._id);
        if (exists) {
          return prevClients.map(c => c._id === updatedClient._id ? updatedClient : c);
        } else {
          return [...prevClients, updatedClient];
        }
      });
    } catch (err) {
      console.error(err);
      setError('Error confirming client request');
    }
  };

  // Confirm payment
  const confirmPayment = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentDone: true })
      });
      if (!response.ok) throw new Error('Failed to update payment status');

      const updatedClient = await response.json();

      setClients(prevClients =>
        prevClients.map(c => (c._id === updatedClient._id ? updatedClient : c))
      );
    } catch (err) {
      setError('Error confirming payment');
    }
  };

  // Delete client
  const deleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete client');

      setClients(prevClients => prevClients.filter(c => c._id !== clientId));
    } catch (err) {
      setError('Error deleting client');
    }
  };

  const filteredClients = clients.filter(client =>
    (client.name && client.name.toLowerCase().includes(search.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(search.toLowerCase())) ||
    (client.property && client.property.title && client.property.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <p>Loading clients...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="clients-container">
      <h2 className="clients-title">Clients</h2>

      <input
        type="text"
        className="search-bar"
        placeholder="Search by client name, email or property"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <table className="clients-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Property</th>
            <th>Payment Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No clients found.</td>
            </tr>
          ) : (
            filteredClients.map(client => (
              <tr key={client._id} onClick={() => markClientAsSeen(client._id)}>
  <td data-label="Name">
    <div className="scroll-content">{client.name}</div>
  </td>
  <td data-label="Email">
    <div className="scroll-content">{client.email}</div>
  </td>
  <td data-label="Property">
    <div className="scroll-content">{client.property?.title || 'N/A'}</div>
  </td>
  <td data-label="Payment Status" className={client.paymentDone ? 'payment-done' : 'payment-pending'}>
    <div className="scroll-content">{client.paymentDone ? 'Done' : 'Pending'}</div>
  </td>
  <td data-label="Actions">
    {client.status !== 'confirmed' && (
      <button onClick={() => confirmClient(client._id)} className="confirm-btn">Confirm</button>
    )}
    {!client.paymentDone && (
      <button onClick={() => confirmPayment(client._id)} className="confirm-btn">Confirm</button>
    )}
    <button onClick={() => deleteClient(client._id)} className="delete-btn">Delete</button>
  </td>
</tr>


            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Clients;
