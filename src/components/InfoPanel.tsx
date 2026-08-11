import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { findPhoto, type NasaPhoto } from '../lib/nasa';
import type { ObjectInfo } from '../lib/info';
import { useLightbox } from './Lightbox';

export default function InfoPanel({
  info,
  onClose,
}: {
  info: ObjectInfo;
  onClose: () => void;
  onCenter?: () => void;
}) {
  const [photo, setPhoto] = useState<NasaPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const openLightbox = useLightbox();