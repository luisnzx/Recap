import React from 'react';
import { Trash2, ChevronRight } from 'lucide-react';

export default function MeetingHistory({ meetings, onSelect, onDelete }) {
  if (meetings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 8px' }}>
        <p style={{ fontSize: 12, color: '#0D0D0D99', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Sin reuniones guardadas
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {meetings.map((meeting, idx) => {
        const date = new Date(meeting.timestamp);
        const formattedDate = date.toLocaleDateString('es-ES', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

        return (
          <div
            key={meeting.id}
            style={{
              background: '#FAFAFA',
              border: '3px solid #0D0D0D',
              boxShadow: '4px 4px 0 #0D0D0D',
              marginBottom: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              transition: 'transform 0.06s ease, box-shadow 0.06s ease',
            }}
            onClick={() => onSelect(meeting)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0 #0D0D0D';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '4px 4px 0 #0D0D0D';
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 800, color: '#0D0D0D',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {meeting.title}
              </p>
              <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{formattedDate}</p>
              {meeting.tasks && (
                <p style={{ fontSize: 10, color: '#888', marginTop: 3, fontWeight: 600 }}>
                  {meeting.tasks.length} TAREAS • {meeting.agreements.length} ACUERDOS
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <ChevronRight style={{ width: 14, height: 14, color: '#9B9B9B' }} />
              <button
                onClick={e => { e.stopPropagation(); onDelete(meeting.id); }}
                style={{
                  background: '#FF5722',
                  border: '2px solid #0D0D0D',
                  padding: '3px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Eliminar"
              >
                <Trash2 style={{ width: 12, height: 12, color: '#FAFAFA' }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
