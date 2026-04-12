import { useEffect } from 'react';
import useVaultStore from '../../stores/vaultStore';
import VaultHome from './VaultHome/VaultHome';
import FranchiseView from './FranchiseView/FranchiseView';
import FigureProfile from './FigureProfile/FigureProfile';
import MyVault from './MyVault/MyVault';
import SeriesTracker from './SeriesTracker/SeriesTracker';
import ReleaseCalendar from './ReleaseCalendar/ReleaseCalendar';
import PhotoStudio from './PhotoStudio/PhotoStudio';

export default function VaultApp() {
  const { vaultView, initCollection, collectionLoaded, notification } = useVaultStore();

  useEffect(() => {
    if (!collectionLoaded) {
      initCollection();
    }
  }, [collectionLoaded, initCollection]);

  const renderView = () => {
    switch (vaultView) {
      case 'franchise':
        return <FranchiseView />;
      case 'figure':
        return <FigureProfile />;
      case 'myVault':
        return <MyVault />;
      case 'series':
        return <SeriesTracker />;
      case 'calendar':
        return <ReleaseCalendar />;
      case 'photoStudio':
        return <PhotoStudio onBack={() => useVaultStore.getState().setVaultView('home')} />;
      default:
        return <VaultHome />;
    }
  };

  return (
    <div className="vault-app">
      {renderView()}

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
