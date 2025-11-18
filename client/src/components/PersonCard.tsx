import type { Person } from '../types';

interface PersonCardProps {
  person: Person;
}

export default function PersonCard({ person }: PersonCardProps) {
  const getInitials = () => {
    return `${person.first_name[0]}${person.last_name[0]}`.toUpperCase();
  };

  const posX = person.photo_position_x ?? 50;
  const posY = person.photo_position_y ?? 50;
  const zoom = person.photo_zoom ?? 1;

  // Convert position (0-100) to translate (-15% to +15%)
  // Smaller range ensures image always covers frame
  const translateX = (posX - 50) * 0.3;
  const translateY = (posY - 50) * 0.3;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full w-full">
      {/* Photo Section - Takes most of the height */}
      <div className="flex-1 relative overflow-hidden bg-gray-200">
        {person.photo_path ? (
          <img
            src={`http://localhost:3001/${person.photo_path}`}
            alt={`${person.first_name} ${person.last_name}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `translate(${translateX}%, ${translateY}%) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-6xl font-bold text-white">{getInitials()}</span>
          </div>
        )}
      </div>

      {/* Name Section - Fixed height at bottom */}
      <div className="p-4 text-center bg-white flex-shrink-0">
        <h3 className="text-xl font-semibold text-gray-900">
          {person.first_name} {person.last_name}
        </h3>
        {person.position_name && (
          <p className="text-gray-600 mt-1 text-sm">{person.position_name}</p>
        )}
      </div>
    </div>
  );
}
