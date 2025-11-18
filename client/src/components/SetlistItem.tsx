import { Music, Video, FileText } from 'lucide-react';
import type { SetlistItem as SetlistItemType } from '../types';

interface SetlistItemProps {
  item: SetlistItemType;
  darkMode?: boolean;
}

export default function SetlistItem({ item, darkMode = true }: SetlistItemProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'song':
        return <Music className="w-5 h-5" />;
      case 'media':
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    if (item.type === 'header') {
      return 'text-xl font-bold border-l-4 border-primary-400 pl-4 py-2';
    }
    return 'flex items-center gap-2 py-1';
  };

  if (item.type === 'header') {
    return (
      <div className={getStyles()}>
        {item.title}
      </div>
    );
  }

  return (
    <div className={getStyles()}>
      {getIcon()}
      <span>{item.title}</span>
      {item.key_name && item.type === 'song' && (
        <span className={`${darkMode ? 'text-primary-300' : 'text-primary-700'} ml-2`}>({item.key_name})</span>
      )}
    </div>
  );
}
