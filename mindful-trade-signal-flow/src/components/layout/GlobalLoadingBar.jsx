import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function GlobalLoadingBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setVisible(true);
    setWidth(30);
    const t1 = setTimeout(() => setWidth(80), 80);
    const t2 = setTimeout(() => { setWidth(100); }, 200);
    const t3 = setTimeout(() => { setVisible(false); setWidth(0); }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out rounded-r-full shadow-sm shadow-primary/50"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}