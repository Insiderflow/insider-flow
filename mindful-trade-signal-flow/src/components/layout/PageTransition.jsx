import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Detail routes slide in from the right; tab routes fade in
const DETAIL_ROUTES = ['/politician', '/issuer', '/openinsider/company', '/openinsider/owner', '/paywall', '/search'];

export default function PageTransition({ children }) {
  const location = useLocation();
  const isDetail = DETAIL_ROUTES.some(r => location.pathname.startsWith(r));

  const variants = isDetail
    ? {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit:    { opacity: 0, x: -24 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
      };

  return (
    <motion.div
      key={location.pathname}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}