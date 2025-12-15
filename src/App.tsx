import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sniper from './pages/Sniper';
import Review from './pages/Review';
import Parse from './pages/Parse';

// Layout component can be defined inline or imported. 
// For now I'll use a wrapper in App or separate file. 
// Since I haven't created Layout.tsx yet, I'll define a simple one here or just use Routes directly.
// The plan mentioned app/_layout in the Expo version, but for Web/Vite we build it.
// I'll create a minimal Layout in src/ui/Layout.tsx later or now.
// For now, let's just route. A common Layout is good for styling.

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sniper" element={<Sniper />} />
          <Route path="/review" element={<Review />} />
          <Route path="/parse" element={<Parse />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
