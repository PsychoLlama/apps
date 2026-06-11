import { Gallery } from '@app/gallery';
import { galleryManifests } from '../gallery-manifests';

export default function GalleryRoute() {
  return <Gallery manifests={galleryManifests} />;
}
