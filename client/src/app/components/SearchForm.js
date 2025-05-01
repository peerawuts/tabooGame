import { useState } from 'react';
import Popup from 'reactjs-popup';

export default function RoomForm() {
  const [hits, setHits] = useState([]);

  const search = async (event) => {
    const q = event.target.value;

    if (q.length > 2) {
      const params = new URLSearchParams({ q });

      const res = await fetch('/api/search?' + params);

      const result = await res.json();
      console.log(result);
      setHits(result['rooms']);
    }
  };

  return (
    <div>
        <Popup trigger={<button className="trigger-button">Click to open popup</button>} position="right center" modal nested>
          {close => (
            <div className="modal">
              <button className="close" onClick={close}>
                &times;
              </button>
              <div className="header"> Scores </div>
              <div className="content">
                      <input
                        onChange={search}
                        type="text"
                        placeholder="check score..."
                        className="form-control"
                      />
                     <ul className="list-group">
                        {
                          hits.map((hit) => (
                            <li
                              className="list-group-item d-flex justify-content-between align-items-start"
                              key={hit.entityId}
                            >
                              <div className="ms-2 me-auto">
                                <div className="fw-bold">
                                  {hit.room} {hit.member} {hit.score}
                                </div>
                                {hit.description}
                              </div>
                            </li>
                          ))}
                      </ul>
              </div>

            </div>
          )}
        </Popup>
     </div>
  );
}
