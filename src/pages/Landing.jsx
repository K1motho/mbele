import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ITEMS_PER_PAGE = 10;

const Landing = () => {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('Nairobi');
  const [keyword, setKeyword] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const fetchEvents = async (pageNumber = 1, isNewSearch = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get('https://www.eventbriteapi.com/v3/events/search/', {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_EVENTBRITE_API_KEY}`,
        },
        params: {
          'location.address': location,
          'q': keyword,
          expand: 'venue,ticket_classes',
          sort_by: 'date',
          page: pageNumber,
          'page_size': ITEMS_PER_PAGE,
        },
      });

      if (isNewSearch || pageNumber === 1) {
        setEvents(res.data.events);
      } else {
        setEvents(prev => [...prev, ...res.data.events]);
      }

      setHasMore(res.data.pagination.has_more_items);
    } catch (err) {
      console.error(err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, true);
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchEvents(1, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEvents(nextPage);
  };

  const toggleDescription = (id) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === id
          ? { ...event, showFullDesc: !event.showFullDesc }
          : event
      )
    );
  };

  return (
    <div>
      <h1>Upcoming Events</h1>

      <div>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Enter location"
        />
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="Enter tag/keyword"
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {loading && events.length === 0 && <p>Loading events...</p>}
      {error && <p>{error}</p>}
      {!loading && events.length === 0 && <p>No upcoming events found.</p>}

      {events.map(event => {
        const desc = event.description?.text || '';
        const showFullDesc = event.showFullDesc || false;
        const displayedDesc = showFullDesc ? desc : desc.substring(0, 200);

        return (
          <div key={event.id}>
            <img
              src={event.logo?.url || 'https://via.placeholder.com/800x300?text=No+Image'}
              alt={event.name.text}
            />

            <div>
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {event.name.text}
              </a>

              <p>
                {displayedDesc}
                {desc.length > 200 && (
                  <button onClick={() => toggleDescription(event.id)}>
                    {showFullDesc ? ' Show Less' : ' Read More'}
                  </button>
                )}
              </p>

              <p><strong>Date:</strong> {new Date(event.start.local).toLocaleString()}</p>
              <p><strong>Venue:</strong> {event.venue?.address.localized_address_display || 'TBA'}</p>

              {event.ticket_classes && event.ticket_classes.length > 0 ? (
                <p>
                  <strong>Tickets:</strong>{' '}
                  {event.ticket_classes
                    .filter(tc => !tc.hidden && tc.is_available)
                    .map(tc => `${tc.name}: ${tc.cost ? tc.cost.display : 'Free'}`)
                    .join(', ')}
                </p>
              ) : (
                <p><strong>Tickets:</strong> Not available</p>
              )}

              <p><strong>Status:</strong> {event.status}</p>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div>
          <button
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Events'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Landing;
